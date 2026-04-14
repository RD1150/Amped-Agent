import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin, ExternalLink, Calendar, BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Utility: format date
function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Utility: strip markdown to plain text excerpt
function stripMarkdown(md: string, maxLen = 160) {
  const plain = md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
}

// Utility: derive slug from name
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Agent Sidebar ──────────────────────────────────────────────────────────────
function AgentSidebar({ persona }: { persona: any }) {
  const accentColor = persona.primaryColor || "#1a3a5c";

  return (
    <aside className="w-full space-y-6">
      {/* Headshot */}
      {persona.headshotUrl && (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <img
            src={persona.headshotUrl}
            alt={persona.agentName || "Agent"}
            className="w-full object-cover aspect-[4/3]"
          />
        </div>
      )}

      {/* Agent info */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{persona.agentName}</h2>
        {persona.brokerageName && (
          <p className="text-sm text-gray-600 font-medium">{persona.brokerageName}</p>
        )}
        {persona.licenseNumber && (
          <p className="text-xs text-gray-500">License #{persona.licenseNumber}</p>
        )}
        {persona.brokerageDRE && (
          <p className="text-xs text-gray-500">Brokerage #{persona.brokerageDRE}</p>
        )}
      </div>

      {/* Location */}
      {(persona.primaryCity || persona.primaryState) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{[persona.primaryCity, persona.primaryState].filter(Boolean).join(", ")}</span>
        </div>
      )}

      {/* Phone */}
      {persona.phoneNumber && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Phone</p>
          <a
            href={`tel:${persona.phoneNumber}`}
            className="text-2xl font-bold hover:underline"
            style={{ color: accentColor }}
          >
            {persona.phoneNumber}
          </a>
        </div>
      )}

      {/* CTA button */}
      {persona.bookingUrl && (
        <a href={persona.bookingUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full text-white font-semibold" style={{ backgroundColor: accentColor }}>
            Book a Free Consultation
          </Button>
        </a>
      )}

      {/* Bio */}
      {persona.bio && (
        <div className="text-sm text-gray-600 leading-relaxed border-t pt-4">
          {persona.bio}
        </div>
      )}

      {/* Social share */}
      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Share This Blog</p>
        <div className="flex gap-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded text-white"
            style={{ backgroundColor: "#1877F2" }}
            aria-label="Share on Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
            target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded text-white bg-black"
            aria-label="Share on X"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded text-white"
            style={{ backgroundColor: "#0A66C2" }}
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          {persona.emailAddress && (
            <a
              href={`mailto:${persona.emailAddress}`}
              className="w-9 h-9 flex items-center justify-center rounded bg-gray-200 text-gray-700"
              aria-label="Email agent"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────────
function PostCard({ post, slug, accentColor }: { post: any; slug: string; accentColor: string }) {
  return (
    <Link href={`/blog/${slug}/${post.id}`}>
      <div className="group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
        {/* Placeholder header image */}
        <div
          className="h-40 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)` }}
        >
          <BookOpen className="w-12 h-12 opacity-30" style={{ color: accentColor }} />
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-gray-900 leading-snug group-hover:underline line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-3">{stripMarkdown(post.content)}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(post.createdAt)}</span>
            {post.city && (
              <>
                <span>·</span>
                <MapPin className="w-3 h-3" />
                <span>{post.city}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Public Blog List Page ──────────────────────────────────────────────────────
export function PublicAgentBlog() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = trpc.blogBuilder.getPublicBlog.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-20 bg-gray-800" />
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <BookOpen className="w-16 h-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-700">Blog Not Found</h1>
        <p className="text-gray-500">This agent's blog doesn't exist or hasn't been set up yet.</p>
      </div>
    );
  }

  const { persona, posts } = data;
  const accentColor = persona.primaryColor || "#1a3a5c";
  const agentSlug = persona.agentName ? toSlug(persona.agentName) : slug;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          {/* Logo / branding */}
          <div className="flex items-center gap-3">
            {persona.logoUrl ? (
              <img src={persona.logoUrl} alt="Logo" className="h-12 w-12 rounded-full object-cover" />
            ) : persona.headshotUrl ? (
              <img src={persona.headshotUrl} alt={persona.agentName || ""} className="h-12 w-12 rounded-full object-cover" />
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">Real Estate Blog</p>
              <h1 className="text-xl font-extrabold leading-tight">
                {persona.brokerageName || "Real Estate Blog"}
              </h1>
              {persona.agentName && (
                <p className="text-xs font-medium" style={{ color: accentColor === "#1a3a5c" ? "#f59e0b" : accentColor }}>
                  WITH {persona.agentName.toUpperCase()}
                </p>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href={`/blog/${agentSlug}`} className="hover:text-white/70 transition-colors">Home</Link>
            {persona.bookingUrl && (
              <a href={persona.bookingUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">
                Get in Touch
              </a>
            )}
            {persona.bookingUrl && (
              <a
                href={persona.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded font-bold text-white text-sm"
                style={{ backgroundColor: accentColor === "#1a3a5c" ? "#f59e0b" : accentColor }}
              >
                FREE HOME EVALUATION
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          {/* Posts grid */}
          <div>
            {posts.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No posts yet</p>
                <p className="text-sm">Check back soon for new articles.</p>
              </div>
            ) : (
              <>
                {/* Featured post */}
                <Link href={`/blog/${agentSlug}/${posts[0].id}`}>
                  <div className="group cursor-pointer mb-8">
                    <div
                      className="w-full h-64 rounded-lg flex items-center justify-center mb-4"
                      style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}55)` }}
                    >
                      <BookOpen className="w-20 h-20 opacity-20" style={{ color: accentColor }} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:underline leading-snug">
                      {posts[0].title}
                    </h2>
                    <p className="text-gray-600 mt-2 text-sm leading-relaxed line-clamp-3">
                      {stripMarkdown(posts[0].content)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(posts[0].createdAt)}</span>
                      {posts[0].city && <><span>·</span><span>{posts[0].city}</span></>}
                    </div>
                  </div>
                </Link>

                {/* Grid of remaining posts */}
                {posts.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {posts.slice(1).map((post: any) => (
                      <PostCard key={post.id} post={post} slug={agentSlug} accentColor={accentColor} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <AgentSidebar persona={persona} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-10 py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} {persona.agentName} · {persona.brokerageName}</p>
        {persona.licenseNumber && <p className="mt-1">License #{persona.licenseNumber}</p>}
        <p className="mt-2">
          Powered by{" "}
          <a href="https://ampedagent.app" className="font-semibold hover:underline" style={{ color: accentColor }}>
            Amped Agent
          </a>
        </p>
      </footer>
    </div>
  );
}

// ── Public Single Post Page ────────────────────────────────────────────────────
export function PublicAgentBlogPost() {
  const { slug, postId } = useParams<{ slug: string; postId: string }>();
  const id = parseInt(postId || "0", 10);
  const { data, isLoading, error } = trpc.blogBuilder.getPublicPost.useQuery(
    { postId: id },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-20 bg-gray-800" />
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-700">Post Not Found</h1>
        <Link href={`/blog/${slug}`}>
          <Button variant="outline">Back to Blog</Button>
        </Link>
      </div>
    );
  }

  const { post, persona } = data;
  const accentColor = persona?.primaryColor || "#1a3a5c";
  const agentSlug = persona?.agentName ? toSlug(persona.agentName) : slug;

  // Render markdown-like content (basic)
  const renderContent = (md: string) => {
    const lines = md.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-8 mb-3 text-gray-900">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-6 mb-2 text-gray-900">{line.slice(4)}</h3>;
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-gray-900">{line.slice(2)}</h1>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 list-disc text-gray-700 mb-1">{line.slice(2)}</li>;
      if (line.trim() === "") return <div key={i} className="h-3" />;
      return <p key={i} className="text-gray-700 leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {persona?.headshotUrl && (
              <img src={persona.headshotUrl} alt={persona?.agentName || ""} className="h-12 w-12 rounded-full object-cover" />
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">Real Estate Blog</p>
              <h1 className="text-xl font-extrabold leading-tight">{persona?.brokerageName || "Real Estate Blog"}</h1>
              {persona?.agentName && (
                <p className="text-xs font-medium" style={{ color: accentColor === "#1a3a5c" ? "#f59e0b" : accentColor }}>
                  WITH {persona.agentName.toUpperCase()}
                </p>
              )}
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href={`/blog/${agentSlug}`} className="hover:text-white/70 transition-colors flex items-center gap-1">
              <ChevronRight className="w-3 h-3 rotate-180" /> All Posts
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          {/* Article */}
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Social share bar (left side on desktop) */}
            <div className="flex gap-2 mb-6 lg:hidden">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded text-white" style={{ backgroundColor: "#1877F2" }}>
                <Facebook className="w-4 h-4" />
              </a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded text-white bg-black">
                <Twitter className="w-4 h-4" />
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded text-white" style={{ backgroundColor: "#0A66C2" }}>
                <Linkedin className="w-4 h-4" />
              </a>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-3">{post.title}</h1>

            <div className="flex items-center gap-3 text-sm text-gray-500 mb-6 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(post.createdAt)}</span>
              {post.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{post.city}</span>}
              {post.wordCount && <span>{post.wordCount.toLocaleString()} words</span>}
              {post.niche && <Badge variant="secondary" className="capitalize">{post.niche.replace("_", " ")}</Badge>}
            </div>

            <Separator className="mb-6" />

            <div className="prose max-w-none">
              {renderContent(post.content)}
            </div>

            {/* Meta description as CTA */}
            {post.metaDescription && (
              <div className="mt-8 p-4 rounded-lg border-l-4" style={{ borderColor: accentColor, backgroundColor: `${accentColor}11` }}>
                <p className="text-sm text-gray-700 italic">{post.metaDescription}</p>
              </div>
            )}

            {/* CTA */}
            {persona?.bookingUrl && (
              <div className="mt-8 text-center">
                <a href={persona.bookingUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="text-white font-bold px-8 py-3" style={{ backgroundColor: accentColor }}>
                    Schedule a Free Consultation
                  </Button>
                </a>
              </div>
            )}
          </article>

          {/* Sidebar */}
          {persona && <AgentSidebar persona={persona} />}
        </div>
      </main>

      <footer className="border-t bg-white mt-10 py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} {persona?.agentName} · {persona?.brokerageName}</p>
        <p className="mt-2">
          Powered by{" "}
          <a href="https://ampedagent.app" className="font-semibold hover:underline" style={{ color: accentColor }}>
            Amped Agent
          </a>
        </p>
      </footer>
    </div>
  );
}
