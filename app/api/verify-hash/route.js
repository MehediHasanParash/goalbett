import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { hash, passwords } = await request.json()

    const results = []
    for (const pwd of passwords) {
      const matches = await bcrypt.compare(pwd, hash)
      results.push({ password: pwd, matches })
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
