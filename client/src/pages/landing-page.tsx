import { SplineSceneBasic } from "@/components/ui/demo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, LogIn, UserPlus } from "lucide-react";
import { SplineScene } from "@/components/ui/splite";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-gold-200 dark:from-cream-900 dark:to-gold-700">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <SplineSceneBasic />
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-gold-700 dark:from-gold-400 dark:to-gold-600">
          Your Personal Reading Companion
        </h2>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gradient-to-r from-cream-50 to-cream-100 dark:from-cream-900 dark:to-cream-800 rounded-lg shadow-md">
              <BookOpen className="w-12 h-12 mx-auto text-gold-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-gold-600 dark:from-gold-400 dark:to-gold-500">Track Your Reading</h3>
              <p className="text-cream-700 dark:text-cream-300">
                Keep track of what you're reading, want to read, and have finished.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-r from-cream-50 to-cream-100 dark:from-cream-900 dark:to-cream-800 rounded-lg shadow-md">
              <LogIn className="w-12 h-12 mx-auto text-gold-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-gold-600 dark:from-gold-400 dark:to-gold-500">Write Reviews</h3>
              <p className="text-cream-700 dark:text-cream-300">
                Share your thoughts and rate books with a simple review system.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-r from-cream-50 to-cream-100 dark:from-cream-900 dark:to-cream-800 rounded-lg shadow-md">
              <UserPlus className="w-12 h-12 mx-auto text-gold-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-gold-600 dark:from-gold-400 dark:to-gold-500">Discover Books</h3>
              <p className="text-cream-700 dark:text-cream-300">
                Explore trending books and discover new reads through community activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-gold-700 dark:from-gold-400 dark:to-gold-600">
            Ready to Start Your Reading Journey?
          </h2>
          <div className="flex justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-cream-100 hover:text-cream-50">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="border-gold-500 hover:border-gold-600 text-gold-500 hover:text-gold-600">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
