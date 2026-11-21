import React from 'react';
import { Instagram, Linkedin, Twitter, Video, Info } from 'lucide-react';
import { HOOK_TYPES } from '../data/mock';

// Platform icon helper
function getPlatformIcon(platform) {
  switch (platform) {
    case 'instagram':
      return <Instagram size={15} strokeWidth={2.2} />;
    case 'linkedin':
      return <Linkedin size={15} strokeWidth={2.2} />;
    case 'x':
      return <Twitter size={15} strokeWidth={2.2} />;
    case 'youtube':
    default:
      return <Video size={15} strokeWidth={2.2} />;
  }
}

// Editable posts table with project name tag and live recalculation on input change
export default function PostsTable({ posts, isUsingSampleData, onUpdateMetric }) {
  return (
    <div className="posts-table-card">
      {/* Sample data informational banner */}
      {isUsingSampleData && (
        <div className="sample-data-note">
          <Info size={16} strokeWidth={2.2} className="sample-data-icon" />
          <span>Sample data. Mark posts as posted on the Calendar to use your own.</span>
        </div>
      )}

      <div className="posts-table-wrapper">
        <table className="posts-table">
          <thead>
            <tr>
              <th className="th-hook">Clip hook</th>
              <th className="th-platform">Platform</th>
              <th className="th-type">Hook type</th>
              <th className="th-time">Post time</th>
              <th className="th-metric">Views</th>
              <th className="th-metric">Likes</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="posts-table-row">
                {/* Clip hook with project tag */}
                <td className="td-hook" title={post.hookLine}>
                  {post.projectName && (
                    <span className="table-project-tag" title={post.projectName}>
                      {post.projectName}
                    </span>
                  )}
                  <span className="hook-line-clamp">{post.hookLine}</span>
                </td>

                {/* Platform */}
                <td className="td-platform">
                  <div className="table-platform-badge">
                    {getPlatformIcon(post.platform)}
                    <span>{post.platformName}</span>
                  </div>
                </td>

                {/* Hook Type Dropdown/Selector */}
                <td className="td-type">
                  <select
                    className="hook-type-select"
                    value={post.hookType}
                    onChange={(e) => onUpdateMetric(post.id, 'hookType', e.target.value)}
                  >
                    {HOOK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Post Time */}
                <td className="td-time">
                  <span className="post-time-badge">{post.postTime}</span>
                </td>

                {/* Editable Views Number Input */}
                <td className="td-metric">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className="metric-number-input"
                    value={post.views}
                    onChange={(e) =>
                      onUpdateMetric(post.id, 'views', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    title="Click to edit views"
                  />
                </td>

                {/* Editable Likes Number Input */}
                <td className="td-metric">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="metric-number-input"
                    value={post.likes}
                    onChange={(e) =>
                      onUpdateMetric(post.id, 'likes', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    title="Click to edit likes"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
