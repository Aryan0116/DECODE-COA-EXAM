import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(user?.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      <Header />
      
      {/* Add beating heart animation to CSS */}
      <style jsx>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
          75% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .beating-heart {
          display: inline-block;
          animation: heartbeat 1.2s infinite;
          transform-origin: center;
        }
      `}</style>
      
      <main className="flex-1 bg-red-100">
        <section className="py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none animate-slide-up">
                    DECODE CO-A EXAM PORTAL
                  </h1>
                  <p
  className="max-w-[600px] text-green-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed animate-slide-up blink-text"
  style={{ animationDelay: "0.1s" }}
>
  A Unit of DECODE CO-A
</p>

                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
                    A modern platform for teachers to create exams and for students to take them. Simple, intuitive, and efficient.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <Button size="lg" onClick={handleGetStarted} className="px-8">
                    Get Started
                  </Button>
                  <Button size="lg" variant="outline" asChild className="px-8">
                    <a href="#features">Learn More</a>
                  </Button>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex items-center justify-center">
                <div className="relative w-full max-w-[500px] aspect-square">
                  <div className="glass-morphism absolute inset-0 rounded-2xl shadow-medium overflow-hidden animate-fade-in">
                    <div className="relative h-full w-full p-8 flex flex-col justify-center items-center">
                      <div className="w-full space-y-6">
                        <div className="h-8 w-1/2 rounded-lg bg-blue-100 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 rounded bg-blue-100/80 animate-pulse"></div>
                          <div className="h-4 rounded bg-blue-100/80 animate-pulse"></div>
                          <div className="h-4 w-2/3 rounded bg-blue-100/80 animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-10 rounded-lg bg-blue-100/90 animate-pulse"></div>
                          <div className="h-10 rounded-lg bg-blue-100/90 animate-pulse"></div>
                          <div className="h-10 rounded-lg bg-blue-100/90 animate-pulse"></div>
                        </div>
                        <div className="h-12 w-1/3 rounded-lg bg-blue-400/80 ml-auto animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="features" className="py-12 md:py-24 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Everything you need</h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides all the tools you need to create and take exams efficiently.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {[
                {
                  title: "Create Questions",
                  description: "Create questions with multiple options, correct answers, and more.",
                  icon: "📝",
                },
                {
                  title: "Import from CSV",
                  description: "Import questions from CSV files for quick exam creation.",
                  icon: "📊",
                },
                {
                  title: "Secure Exams",
                  description: "Create exams with secret codes for secure access.",
                  icon: "🔒",
                },
                {
                  title: "Student Dashboard",
                  description: "Students can view and take available exams.",
                  icon: "👨‍🎓",
                },
                {
                  title: "Teacher Controls",
                  description: "Full control over exams, questions, and student access.",
                  icon: "👩‍🏫",
                },
                {
                  title: "Teacher Approved Results",
                  description: "Students get feedback after teachers approve completed exams.",
                  icon: "✅",
                },
              ].map((feature, i) => (
                <div key={i} className="glass-morphism rounded-xl p-6 card-hover">
                  <div className="mb-4 text-4xl">{feature.icon}</div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-500 mt-2">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-gray-200 bg-green-100">
        <div className="container flex flex-col gap-2 py-6 px-4 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-xs text-gray-500 md:text-left">
            © {new Date().getFullYear()} DECODE CO-A EXAM PORTAL. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Created with <span className="beating-heart text-red-500">❤️</span> by Decode CO-A team 
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <a href="#" className="text-xs text-gray-500 hover:underline">Terms of Service</a>
            <a href="#" className="text-xs text-gray-500 hover:underline">Privacy Policy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Index;