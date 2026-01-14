import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Newspaper, RefreshCw, Sparkles, ExternalLink, Calendar } from 'lucide-react';


interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

export default function TrendingNews() {
  const [generatingPostId, setGeneratingPostId] = useState<string | null>(null);

  // Fetch trending real estate news
  const { data: newsArticles, isLoading, refetch } = trpc.news.getTrendingNews.useQuery();

  // Generate post from news article
  const generatePostMutation = trpc.news.generateNewsPost.useMutation({
    onSuccess: () => {
      alert('Post Generated! Your news post has been added to the content calendar.');
      setGeneratingPostId(null);
    },
    onError: (error: any) => {
      alert(`Generation Failed: ${error.message}`);
      setGeneratingPostId(null);
    },
  });

  const handleGeneratePost = async (article: NewsArticle) => {
    setGeneratingPostId(article.id);
    await generatePostMutation.mutateAsync({
      articleId: article.id,
      title: article.title,
      summary: article.summary,
      source: article.source,
      url: article.url,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-blue-600" />
            Trending Real Estate News
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay ahead of the market. Generate expert commentary on the latest real estate news.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh News
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading latest real estate news...</p>
          </div>
        </div>
      )}

      {/* News Articles Grid */}
      {!isLoading && newsArticles && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article) => (
            <Card key={article.id} className="flex flex-col">
              {/* Article Image */}
              {article.imageUrl && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                  <span className="text-blue-600 font-medium">{article.source}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {article.summary}
                </p>

                <div className="mt-auto space-y-2">
                  <Button
                    onClick={() => handleGeneratePost(article)}
                    disabled={generatingPostId === article.id}
                    className="w-full"
                  >
                    {generatingPostId === article.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Post
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Read Full Article
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && newsArticles && newsArticles.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No News Available</h3>
          <p className="text-muted-foreground mb-4">
            We couldn't fetch any real estate news at the moment.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
