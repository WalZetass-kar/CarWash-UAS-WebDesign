'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LandingPage } from "@/components/landing/landing-page"

export default function Home() {

  useEffect(() => {

    async function testSupabase() {

      const { data, error } = await supabase
        .from('test')
        .select('*')

      console.log('DATA:', data)
      console.log('ERROR:', error)
    }

    testSupabase()

  }, [])

  return <LandingPage />
}