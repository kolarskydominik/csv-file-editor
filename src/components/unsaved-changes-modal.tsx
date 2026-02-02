import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type UnsavedChangesModalProps = {
	isOpen: boolean;
	onSave: () => void;
	onDiscard: () => void;
	onCancel: () => void;
	isSaving?: boolean;
};

export function UnsavedChangesModal({
	isOpen,
	onSave,
	onDiscard,
	onCancel,
	isSaving = false,
}: UnsavedChangesModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<div className="flex items-center gap-3">
						<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
						<DialogTitle>Unsaved Changes</DialogTitle>
					</div>
					<DialogDescription>
						You have unsaved changes. What would you like to do?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={onCancel} disabled={isSaving}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={onDiscard} disabled={isSaving}>
						Discard Changes
					</Button>
					<Button onClick={onSave} disabled={isSaving}>
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
