import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@tanstack/backend/convex/_generated/api";
import type { Id } from "@tanstack/backend/convex/_generated/dataModel";

interface JobStatusDisplayProps {
	jobId: Id<"backgroundJobs">;
	onRetry?: () => void;
	onComplete?: (result: any) => void;
}

export function JobStatusDisplay({
	jobId,
	onRetry,
	onComplete,
}: JobStatusDisplayProps) {
	// Subscribe to job updates - auto-updates via Convex reactive query
	const { data: job } = useSuspenseQuery(
		convexQuery(api.backgroundJobs.getJob, { jobId })
	);

	// Call onComplete callback when job completes (side effect in useEffect)
	useEffect(() => {
		if (
			job.status === "completed" &&
			job.result &&
			typeof onComplete === "function"
		) {
			onComplete(job.result);
		}
	}, [job.status, job.result, onComplete]);

	// Render based on job status
	switch (job.status) {
		case "pending":
			return (
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
					<div className="flex items-start gap-3">
						<div className="text-blue-600 dark:text-blue-400">⏱️</div>
						<p className="text-sm text-blue-900 dark:text-blue-100">
							Job queued and waiting to be processed...
						</p>
					</div>
				</div>
			);

		case "processing":
			return (
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
					<div className="space-y-3">
						<div className="flex items-start gap-3">
							<div className="animate-spin text-blue-600 dark:text-blue-400">
								⟳
							</div>
							<p className="text-sm text-blue-900 dark:text-blue-100">
								Processing...
							</p>
						</div>
						{job.progress !== undefined && (
							<div className="space-y-1">
								<div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
									<div
										className="h-full bg-blue-600 transition-all dark:bg-blue-400"
										style={{ width: `${job.progress}%` }}
									/>
								</div>
								<p className="text-xs text-blue-700 dark:text-blue-300">
									{job.progress}% complete
								</p>
							</div>
						)}
					</div>
				</div>
			);

		case "completed":
			return (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
					<div className="space-y-2">
						<div className="flex items-start gap-3">
							<div className="text-green-600 dark:text-green-400">✓</div>
							<p className="font-medium text-green-900 dark:text-green-100">
								Job completed successfully!
							</p>
						</div>
						{job.result && (
							<details className="mt-2">
								<summary className="cursor-pointer text-xs text-green-700 dark:text-green-300">
									View result
								</summary>
								<pre className="mt-2 max-h-40 overflow-auto rounded bg-green-100 p-2 text-xs dark:bg-green-900">
									{JSON.stringify(job.result, null, 2)}
								</pre>
							</details>
						)}
					</div>
				</div>
			);

		case "failed":
			return (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
					<div className="space-y-2">
						<div className="flex items-start gap-3">
							<div className="text-red-600 dark:text-red-400">✕</div>
							<div className="flex-1 space-y-2">
								<p className="font-medium text-red-900 dark:text-red-100">
									Job failed
								</p>
								{job.error && (
									<p className="text-sm text-red-700 dark:text-red-300">
										{job.error}
									</p>
								)}
								{onRetry && (
									<button
										onClick={onRetry}
										className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
									>
										Retry
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			);

		default:
			return (
				<div className="rounded-lg border p-4">
					<p className="text-sm">Unknown job status: {job.status}</p>
				</div>
			);
	}
}
