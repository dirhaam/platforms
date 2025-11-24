import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  error: string | null;
}

export function NotesSection({
  notes,
  onNotesChange,
  error,
}: NotesSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-xs font-semibold text-txt-secondary uppercase">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add special requests or notes here..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="text-sm bg-white border-gray-200 focus:border-primary focus:ring-primary/20 resize-none shadow-sm"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-lg flex items-start gap-3">
          <i className='bx bx-alert-circle text-xl mt-0.5'></i>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </>
  );
}
