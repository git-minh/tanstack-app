import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpForm({
	onSwitchToSignIn,
	redirectTo,
}: {
	onSwitchToSignIn: () => void;
	redirectTo?: string;
}) {
	const navigate = useNavigate({
		from: "/",
	});

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: redirectTo || "/dashboard",
						});
						toast.success("Sign up successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	return (
		<div className="mx-auto w-full mt-10 max-w-md p-6">
			<h1 className="mb-8 text-center text-3xl font-light tracking-tight">Create Account</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				<div>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="text-[10px] uppercase tracking-widest font-medium">
									Name
								</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="rounded-none border-foreground font-light"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-[10px] text-destructive uppercase tracking-widest">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="text-[10px] uppercase tracking-widest font-medium">
									Email
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="rounded-none border-foreground font-light"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-[10px] text-destructive uppercase tracking-widest">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="text-[10px] uppercase tracking-widest font-medium">
									Password
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="rounded-none border-foreground font-light"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-[10px] text-destructive uppercase tracking-widest">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? "Submitting..." : "Sign Up"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-6 text-center">
				<Button
					variant="link"
					onClick={onSwitchToSignIn}
					className="text-xs uppercase tracking-widest font-light hover:underline"
				>
					Already have an account? Sign In
				</Button>
			</div>
		</div>
	);
}
