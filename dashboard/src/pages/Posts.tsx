import { useState, useEffect } from 'react';
import { FileText, Image, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToPosts } from '@/services/firestore';
import type { Post } from '@/types';
import { format } from 'date-fns';

const Posts = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'gmb' | 'social'>('all');

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToPosts(user.uid, (postsData) => {
            setPosts(postsData);
            setLoading(false);
        }, 100);

        return () => unsubscribe();
    }, [user]);

    const filteredPosts = posts.filter((post) => {
        if (filter === 'all') return true;
        if (filter === 'gmb') return post.type === 'gmb';
        return ['facebook', 'instagram', 'twitter', 'linkedin'].includes(post.type);
    });

    const getStatusIcon = (status: Post['status']) => {
        switch (status) {
            case 'posted':
                return <CheckCircle className="text-green-500" size={18} />;
            case 'failed':
                return <XCircle className="text-red-500" size={18} />;
            case 'pending':
                return <Clock className="text-yellow-500" size={18} />;
        }
    };

    const getTypeColor = (type: Post['type']) => {
        const colors: Record<string, string> = {
            gmb: 'bg-blue-100 text-blue-700',
            facebook: 'bg-blue-100 text-blue-700',
            instagram: 'bg-pink-100 text-pink-700',
            twitter: 'bg-sky-100 text-sky-700',
            linkedin: 'bg-blue-100 text-blue-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
                        <p className="text-gray-600 mt-1">View all your automated posts</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('gmb')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'gmb' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            GMB
                        </button>
                        <button
                            onClick={() => setFilter('social')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'social' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Social
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="card text-center py-12">
                        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                        <p className="text-gray-600 mt-1">Your automated posts will appear here</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredPosts.map((post) => (
                            <div key={post.id} className="card">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        {post.imageUrl ? (
                                            <img
                                                src={post.imageUrl}
                                                alt="Post"
                                                className="w-20 h-20 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Image className="text-gray-400" size={24} />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(post.type)}`}>
                                                    {post.type.toUpperCase()}
                                                </span>
                                                <div className="flex items-center space-x-1">
                                                    {getStatusIcon(post.status)}
                                                    <span className="text-sm text-gray-600 capitalize">{post.status}</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-900">{post.content}</p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                {format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}
                                            </p>
                                            {post.error && (
                                                <p className="text-sm text-red-600 mt-2">Error: {post.error}</p>
                                            )}
                                        </div>
                                    </div>
                                    {post.status === 'failed' && (
                                        <button className="btn-secondary text-sm">
                                            <RefreshCw size={16} className="mr-1" />
                                            Retry
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Posts;