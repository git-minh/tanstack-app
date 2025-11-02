interface AuthLayoutProps {
	children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className="flex min-h-svh items-center justify-center p-4">
			<div className="w-full max-w-md">{children}</div>
		</div>
	);
}
