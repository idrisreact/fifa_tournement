"use client";

import { useRef } from "react";
import { addFixtureCommentAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  fixtureId: string;
};

export function CommentForm({ fixtureId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addFixtureCommentAction(formData);
        formRef.current?.reset();
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="fixture_id" value={fixtureId} />
      <Input name="body" maxLength={280} placeholder="Add a comment" required />
      <Button type="submit" size="sm">
        Post
      </Button>
    </form>
  );
}
