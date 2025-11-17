import {
	createFileRoute,
	useRouteContext,
	useNavigate,
} from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Layers, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const context = useRouteContext({ from: Route.id });
	const navigate = useNavigate({ from: "/" });
	const healthCheck = useQuery(convexQuery(api.healthCheck.get, {}));
	const heroRef = useRef<HTMLDivElement>(null);
	const featuresRef = useRef<HTMLDivElement>(null);

	const isAuthenticated = !!context.userId;

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("animate-in");
					}
				});
			},
			{ threshold: 0.1 }
		);

		const elements = document.querySelectorAll(".fade-in-on-scroll");
		elements.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	}, []);

	const handleGetStarted = () => {
		if (isAuthenticated) {
			navigate({ to: "/dashboard" });
		} else {
			navigate({ to: "/login" });
		}
	};

	const features = [
		{
			icon: Layers,
			title: "Projects",
			description: "Hierarchical organization for complex work",
		},
		{
			icon: Sparkles,
			title: "AI-Powered",
			description: "Generate projects from natural language",
		},
		{
			icon: Zap,
			title: "Real-time",
			description: "Reactive database keeps everything in sync",
		},
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-sm bg-background/80">
				<div className="container mx-auto px-6 h-16 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Logo className="h-7" />
						<span className="text-sm font-medium tracking-wider uppercase">
							Streamline
						</span>
					</div>
					<div className="flex items-center gap-4">
						<div
							className={`h-1.5 w-1.5 rounded-full transition-colors ${
								healthCheck.data === "OK"
									? "bg-emerald-500"
									: healthCheck.isLoading
										? "bg-amber-400"
										: "bg-red-500"
							}`}
						/>
						<ThemeToggle />
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section ref={heroRef} className="pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-6xl">
					<div className="grid grid-cols-12 gap-8 items-end">
						{/* Large Typography */}
						<div className="col-span-12 lg:col-span-7 space-y-8">
							<div className="space-y-2">
								<h1 className="text-[clamp(3rem,12vw,10rem)] font-light leading-[0.85] tracking-tighter">
									Think
									<br />
									<span className="inline-block border-b-8 border-foreground pb-2">
										Plan
									</span>
									<br />
									Execute
								</h1>
							</div>
							<p className="text-lg md:text-xl text-muted-foreground max-w-md font-light leading-relaxed">
								A minimalist approach to project management.
								<br />
								Powered by AI. Built for focus.
							</p>
						</div>

						{/* Geometric Shape */}
						<div className="col-span-12 lg:col-span-5 flex justify-end">
							<div className="relative w-full max-w-xs aspect-square">
								<div className="absolute inset-0 border-2 border-foreground transform rotate-6 animate-float" />
								<div className="absolute inset-0 border-2 border-foreground/30 transform -rotate-6 animate-float-delayed" />
								<div className="absolute inset-8 bg-foreground flex items-center justify-center">
									<span className="text-background text-6xl font-light">∞</span>
								</div>
							</div>
						</div>
					</div>

					{/* CTA */}
					<div className="mt-16 flex flex-col sm:flex-row gap-4">
						<Button
							onClick={handleGetStarted}
							size="lg"
							className="group text-base h-14 px-8 bg-foreground text-background hover:bg-foreground/90 rounded-none font-light tracking-wide"
						>
							{isAuthenticated ? "Go to Dashboard" : "Get Started"}
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Button>
						<Button
							onClick={() =>
								document
									.getElementById("features")
									?.scrollIntoView({ behavior: "smooth" })
							}
							size="lg"
							variant="outline"
							className="text-base h-14 px-8 rounded-none font-light tracking-wide"
						>
							Learn More
						</Button>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section
				id="features"
				ref={featuresRef}
				className="py-32 px-6 border-t-2 border-foreground"
			>
				<div className="container mx-auto max-w-6xl">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-foreground">
						{features.map((feature, index) => {
							const Icon = feature.icon;
							return (
								<div
									key={index}
									className="fade-in-on-scroll bg-background p-12 hover:bg-foreground hover:text-background transition-colors duration-500 group cursor-default"
									style={{ animationDelay: `${index * 100}ms` }}
								>
									<div className="space-y-6">
										<div className="h-12 w-12 border-2 border-current flex items-center justify-center">
											<Icon className="h-6 w-6" strokeWidth={1.5} />
										</div>
										<h3 className="text-2xl font-light tracking-tight">
											{feature.title}
										</h3>
										<p className="text-sm leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
											{feature.description}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-32 px-6">
				<div className="container mx-auto max-w-6xl">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-16">
						<div className="space-y-6 fade-in-on-scroll">
							<div className="text-8xl md:text-9xl font-light tabular-nums leading-none">
								01
							</div>
							<h3 className="text-3xl font-light">Single Source of Truth</h3>
							<p className="text-muted-foreground leading-relaxed max-w-md">
								Centralize your projects, tasks, and contacts. No more context
								switching between tools.
							</p>
						</div>
						<div className="space-y-6 fade-in-on-scroll md:pt-32">
							<div className="text-8xl md:text-9xl font-light tabular-nums leading-none">
								02
							</div>
							<h3 className="text-3xl font-light">AI Acceleration</h3>
							<p className="text-muted-foreground leading-relaxed max-w-md">
								Generate entire projects from descriptions. Get intelligent
								suggestions. Work faster.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="py-32 px-6 border-t-2 border-foreground">
				<div className="container mx-auto max-w-6xl">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
						<div className="space-y-2">
							<h2 className="text-5xl md:text-7xl font-light tracking-tighter">
								Ready to start?
							</h2>
							<p className="text-muted-foreground text-lg">
								Join and experience focused productivity.
							</p>
						</div>
						<Button
							onClick={handleGetStarted}
							size="lg"
							className="group text-base h-14 px-8 bg-foreground text-background hover:bg-foreground/90 rounded-none font-light tracking-wide whitespace-nowrap"
						>
							{isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-12 px-6">
				<div className="container mx-auto max-w-6xl">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
						<div className="text-xs text-muted-foreground font-light">
							© {new Date().getFullYear()} Streamline. Built with TanStack & Convex.
						</div>
						<div className="flex items-center gap-6 text-xs text-muted-foreground">
							<a
								href="#"
								className="hover:text-foreground transition-colors font-light"
							>
								Privacy
							</a>
							<a
								href="#"
								className="hover:text-foreground transition-colors font-light"
							>
								Terms
							</a>
							<a
								href="#"
								className="hover:text-foreground transition-colors font-light"
							>
								Docs
							</a>
						</div>
					</div>
				</div>
			</footer>

			{/* Custom Styles */}
			<style>{`
				@keyframes float {
					0%, 100% { transform: rotate(6deg) translateY(0px); }
					50% { transform: rotate(6deg) translateY(-10px); }
				}

				@keyframes float-delayed {
					0%, 100% { transform: rotate(-6deg) translateY(0px); }
					50% { transform: rotate(-6deg) translateY(10px); }
				}

				.animate-float {
					animation: float 6s ease-in-out infinite;
				}

				.animate-float-delayed {
					animation: float-delayed 6s ease-in-out infinite;
					animation-delay: -3s;
				}

				.fade-in-on-scroll {
					opacity: 0;
					transform: translateY(20px);
					transition: opacity 0.8s ease-out, transform 0.8s ease-out;
				}

				.fade-in-on-scroll.animate-in {
					opacity: 1;
					transform: translateY(0);
				}

				/* Smooth scrolling */
				html {
					scroll-behavior: smooth;
				}
			`}</style>
		</div>
	);
}
