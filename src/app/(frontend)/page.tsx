import React from 'react'
import Image from 'next/image'
import { headers as getHeaders } from 'next/headers.js'

import { getPayload } from 'payload'
import config from '@/payload.config'

import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="home">
      <div className="content">
        <picture>
          <source srcSet="/logo.webp" />
          <Image alt="Logo" src="/logo.webp" width={154} height={39} />
        </picture>

        {!user && (
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            Bem-vindo ao Blog do Juridiq.
          </h1>
        )}
        {user && (
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Bem-vindo(a) de volta, {user.email}
          </h1>
        )}
        <div className="links">
          <a
            className="admin"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Acessar Admin
          </a>
        </div>
      </div>
    </div>
  )
}
