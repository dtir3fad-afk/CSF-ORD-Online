import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import FirebaseDebug from '@/components/FirebaseDebug'

export const metadata: Metadata = {
  title: 'DTI CSF System',
  description: 'Department of Trade and Industry Client Satisfaction Feedback System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <FirebaseDebug />
      </body>
    </html>
  )
}