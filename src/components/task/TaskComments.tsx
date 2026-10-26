import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send } from 'lucide-react';
import { Comment } from '../../types';
import { db } from '../../lib/db';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { dateUtils } from '../../lib/dates';
import { cn } from '../../lib/utils';

interface TaskCommentsProps {
  taskId: string;
  disabled?: boolean;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, disabled = false }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  
  const comments = db.getComments(taskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || disabled || !newComment.trim()) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      taskId,
      authorId: user.id,
      body: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    db.saveComment(comment);
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Comments</h3>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">No comments yet.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const author = db.getUser(comment.authorId);
              return (
                <div key={comment.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {author?.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{author?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{dateUtils.formatDate(comment.createdAt)}</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-secondary/30 p-3 rounded-lg border border-secondary">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleAddComment} className="flex flex-col gap-2">
        <textarea
          disabled={disabled}
          className={cn(
            "flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 ring-primary",
            disabled && "opacity-60 cursor-not-allowed bg-muted/30"
          )}
          placeholder={disabled ? "You don't have permission to add comments" : "Add a comment... (Markdown supported)"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          {disabled ? (
            <span className="text-xs text-muted-foreground italic">
              You don't have permission to add comments.
            </span>
          ) : (
            <span />
          )}
          <Button type="submit" size="sm" className="gap-2" disabled={disabled || !newComment.trim()}>
            <Send className="h-3 w-3" /> Post Comment
          </Button>
        </div>
      </form>
    </div>
  );
};
