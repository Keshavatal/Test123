import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JournalEntry as JournalEntryType } from "@shared/schema";
import { format } from "date-fns";
import { moodOptions } from "@/lib/exercises";

interface JournalEntryProps {
  entry: JournalEntryType;
}

export function JournalEntry({ entry }: JournalEntryProps) {
  // Find the mood emoji if mood is set
  const moodEmoji = entry.mood 
    ? moodOptions.find(m => m.value === entry.mood)?.emoji 
    : null;

  return (
    <Card className="mb-4 app-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-lg">
          <div className="flex items-center gap-2">
            {moodEmoji && <span className="text-xl">{moodEmoji}</span>}
            <span>{entry.title}</span>
          </div>
          <span className="text-sm font-normal text-gray-500">
            {format(new Date(entry.createdAt), "MMM d, yyyy")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-gray-700">
          {entry.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-2">{paragraph}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
