import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { statuses, categories } from "../data/data";
import {
	type Contact,
	contactFormSchema,
	type ContactFormValues,
} from "../data/schema";

interface ContactFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	contact?: Contact;
	onSubmit: (values: ContactFormValues) => Promise<void>;
	mode: "create" | "edit";
}

export function ContactFormDialog({
	open,
	onOpenChange,
	contact,
	onSubmit,
	mode,
}: ContactFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
		reset,
	} = useForm<ContactFormValues>({
		resolver: zodResolver(contactFormSchema),
		defaultValues: {
			firstName: contact?.firstName || "",
			lastName: contact?.lastName || "",
			email: contact?.email || "",
			phone: contact?.phone || "",
			company: contact?.company || "",
			title: contact?.title || "",
			department: contact?.department || "",
			website: contact?.website || "",
			address: contact?.address || "",
			notes: contact?.notes || "",
			status: contact?.status || "active",
			category: contact?.category || "client",
		},
	});

	// Reset form when dialog opens/closes or contact changes
	useEffect(() => {
		if (open) {
			reset({
				firstName: contact?.firstName || "",
				lastName: contact?.lastName || "",
				email: contact?.email || "",
				phone: contact?.phone || "",
				company: contact?.company || "",
				title: contact?.title || "",
				department: contact?.department || "",
				website: contact?.website || "",
				address: contact?.address || "",
				notes: contact?.notes || "",
				status: contact?.status || "active",
				category: contact?.category || "client",
			});
		}
	}, [open, contact, reset]);

	const onFormSubmit = async (values: ContactFormValues) => {
		setIsSubmitting(true);
		try {
			await onSubmit(values);
			onOpenChange(false);
		} catch (error) {
			console.error("Form submission error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground">
				<DialogHeader>
					<DialogTitle className="text-2xl font-light tracking-tight">
						{mode === "create" ? "Add Contact" : "Edit Contact"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onFormSubmit)}>
					<div className="grid gap-6 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-1.5">
								<Label htmlFor="firstName" className="text-[10px] uppercase tracking-widest font-medium">
									First Name *
								</Label>
								<Input
									id="firstName"
									placeholder="John"
									{...register("firstName")}
									className={`rounded-none border-foreground font-light ${errors.firstName ? "border-destructive" : ""}`}
								/>
								{errors.firstName && (
									<p className="text-[10px] text-destructive uppercase tracking-widest">
										{errors.firstName.message}
									</p>
								)}
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="lastName" className="text-[10px] uppercase tracking-widest font-medium">
									Last Name *
								</Label>
								<Input
									id="lastName"
									placeholder="Doe"
									{...register("lastName")}
									className={`rounded-none border-foreground font-light ${errors.lastName ? "border-destructive" : ""}`}
								/>
								{errors.lastName && (
									<p className="text-[10px] text-destructive uppercase tracking-widest">
										{errors.lastName.message}
									</p>
								)}
							</div>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-medium">
								Email *
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="john.doe@example.com"
								{...register("email")}
								className={`rounded-none border-foreground font-light ${errors.email ? "border-destructive" : ""}`}
							/>
							{errors.email && (
								<p className="text-[10px] text-destructive uppercase tracking-widest">
									{errors.email.message}
								</p>
							)}
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="phone" className="text-[10px] uppercase tracking-widest font-medium">
								Phone
							</Label>
							<Input
								id="phone"
								type="tel"
								placeholder="+1 (555) 123-4567"
								{...register("phone")}
								className="rounded-none border-foreground font-light"
							/>
						</div>

						<div className="h-px bg-border" />

						<div className="grid gap-1.5">
							<Label htmlFor="company" className="text-[10px] uppercase tracking-widest font-medium">
								Company
							</Label>
							<Input
								id="company"
								placeholder="Acme Corporation"
								{...register("company")}
								className="rounded-none border-foreground font-light"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-1.5">
								<Label htmlFor="title" className="text-[10px] uppercase tracking-widest font-medium">
									Job Title
								</Label>
								<Input
									id="title"
									placeholder="Software Engineer"
									{...register("title")}
									className="rounded-none border-foreground font-light"
								/>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="department" className="text-[10px] uppercase tracking-widest font-medium">
									Department
								</Label>
								<Input
									id="department"
									placeholder="Engineering"
									{...register("department")}
									className="rounded-none border-foreground font-light"
								/>
							</div>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="website" className="text-[10px] uppercase tracking-widest font-medium">
								Website
							</Label>
							<Input
								id="website"
								type="url"
								placeholder="https://example.com"
								{...register("website")}
								className={`rounded-none border-foreground font-light ${errors.website ? "border-destructive" : ""}`}
							/>
							{errors.website && (
								<p className="text-[10px] text-destructive uppercase tracking-widest">
									{errors.website.message}
								</p>
							)}
						</div>

						<div className="h-px bg-border" />

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-1.5">
								<Label htmlFor="status" className="text-[10px] uppercase tracking-widest font-medium">
									Status
								</Label>
								<Select
									value={watch("status")}
									onValueChange={(value) => setValue("status", value)}
								>
									<SelectTrigger id="status" className="rounded-none border-foreground font-light">
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent className="rounded-none">
										{statuses.map((status) => (
											<SelectItem key={status.value} value={status.value} className="font-light">
												{status.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="category" className="text-[10px] uppercase tracking-widest font-medium">
									Category
								</Label>
								<Select
									value={watch("category")}
									onValueChange={(value) => setValue("category", value)}
								>
									<SelectTrigger id="category" className="rounded-none border-foreground font-light">
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent className="rounded-none">
										{categories.map((category) => (
											<SelectItem key={category.value} value={category.value} className="font-light">
												{category.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="address" className="text-[10px] uppercase tracking-widest font-medium">
								Address
							</Label>
							<Textarea
								id="address"
								placeholder="123 Main St, City, State, ZIP"
								{...register("address")}
								rows={2}
								className="rounded-none border-foreground font-light"
							/>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="notes" className="text-[10px] uppercase tracking-widest font-medium">
								Notes
							</Label>
							<Textarea
								id="notes"
								placeholder="Additional notes"
								{...register("notes")}
								rows={3}
								className="rounded-none border-foreground font-light"
							/>
						</div>
					</div>
					<DialogFooter className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="rounded-none border-foreground font-light"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
						>
							{isSubmitting
								? mode === "create"
									? "Adding..."
									: "Saving..."
								: mode === "create"
									? "Add Contact"
									: "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
