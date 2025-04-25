
import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface FeedbackFormProps {
  initialValue: string;
  onSubmit: (feedback: string) => void;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ initialValue, onSubmit, onCancel }) => {
  const [feedback, setFeedback] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(feedback);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Provide Feedback</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Textarea
            placeholder="Enter your feedback for the student..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-32"
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Submit Feedback
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default FeedbackForm;