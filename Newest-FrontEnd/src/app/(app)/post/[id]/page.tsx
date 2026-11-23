'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import ArticlePost from '@/components/article-post';
import CommentSection from '@/components/comment-section';
import Post from '@/components/post';
import { queryKeys } from '@/lib/query-keys';
import { getPostById } from '@/services/post.service';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => getPostById(id),
    enabled: !!id,
  });

  return (
    <ArticlePost>
      {isLoading && (
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (isError || !post) && <div className="p-8 text-center">Post não encontrado</div>}

      {post && (
        <div className="space-y-6 md:p-6">
          <Post post={post} clickable={false} fullDate />
          <CommentSection postId={post.id} total={post.comments} />
        </div>
      )}
    </ArticlePost>
  );
}
