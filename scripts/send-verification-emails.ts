import { PrismaClient } from '@prisma/client'
import { resend, FROM_EMAIL } from '../lib/email/resend'
import { VerificationEmail } from '../emails/verification'
import { render } from '@react-email/render'
import * as React from 'react'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function sendVerificationEmails() {
  try {
    // Find all unverified users
    const unverifiedUsers = await prisma.travelers.findMany({
      where: {
        emailVerified: false,
        emailVerificationToken: null // Users who haven't been sent a token yet
      }
    })

    console.log(`Found ${unverifiedUsers.length} unverified users`)

    for (const user of unverifiedUsers) {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex')
      const tokenExpiry = new Date()
      tokenExpiry.setHours(tokenExpiry.getHours() + 24) // Token expires in 24 hours

      // Update user with token
      await prisma.travelers.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationTokenExpiry: tokenExpiry
        }
      })

      // Send verification email
      if (process.env.RESEND_API_KEY) {
        try {
          const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`
          
          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'BSH: Please verify your email address',
            html: await render(
              React.createElement(VerificationEmail, {
                firstName: user.firstName,
                verificationUrl,
              })
            ),
          })
          
          console.log(`✅ Sent verification email to ${user.email}`)
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${user.email}:`, emailError)
        }
      } else {
        console.log(`⚠️  No RESEND_API_KEY found - would send to ${user.email}`)
      }
    }

    console.log('Done!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

sendVerificationEmails()