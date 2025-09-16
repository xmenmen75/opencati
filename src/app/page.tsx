import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#362A85] to-[#7F174C] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
          OpenCATI
        </h1>
        <p className="text-xl text-white/80 mb-8">
          Welcome to the Future of Blockchain Card Trading
        </p>
        <Link href="/home">
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-2xl transform hover:scale-105 transition-all duration-200">
            Enter Platform
          </Button>
        </Link>
      </div>
    </div>
  )
}
