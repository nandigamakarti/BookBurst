'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "./spotlight"
 
export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] bg-gradient-to-r from-cream-50 to-gold-200 dark:from-cream-900 dark:to-gold-700 relative overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="gold-500"
      />
      
      <div className="flex h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-gold-700">
            Interactive 3D
          </h1>
          <p className="mt-4 text-cream-700 max-w-lg">
            Welcome to BookBurst - Your Personal Reading Tracker
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center text-cream-700">
              <span className="mr-2 text-gold-500">📚</span>
              <span>Track your reading journey</span>
            </div>
            <div className="flex items-center text-cream-700">
              <span className="mr-2 text-gold-500">⭐</span>
              <span>Rate and review books</span>
            </div>
            <div className="flex items-center text-cream-700">
              <span className="mr-2 text-gold-500">👥</span>
              <span>Discover community insights</span>
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 relative">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}
