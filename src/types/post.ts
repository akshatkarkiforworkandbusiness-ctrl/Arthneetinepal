export interface Post {
  id: string;
  type: 'discussion' | 'research' | 'question';
  title?: string;
  author: string;
  authorId: string;
  category: 'Finance' | 'Economics' | 'Business' | 'Policy' | 'Other';
  content: string; // HTML for discussion/research, plain text for question
  abstract?: string;
  imageUrl?: string;
  pdfUrl?: string;
  likes: number;
  commentCount: number;
  createdAt: any;
  updatedAt?: any;
  seeded?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  likes: number;
  createdAt: any;
  parentId?: string;
}
