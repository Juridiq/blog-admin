import React from 'react'

import './styles.css'

export const metadata = {
  title: 'Blog - Juridiq',
  description: 'Blog do Juridiq',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
