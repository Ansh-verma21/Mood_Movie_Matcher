export interface Movie {
  title: string;
  genre: string;
  description: string;
  imageUrl: string;
}

export interface ExpressionMap {
  [key: string]: Movie[];
}