const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateFirestoreData() {
  try {
    console.log('Starting Firestore migration...');

    // Load exported data
    let exportData;
    try {
      exportData = require('./firestore-export.json');
      console.log('Firestore export data loaded successfully:', Object.keys(exportData));
    } catch (error) {
      console.error('Failed to load firestore-export.json:', error);
      return;
    }

    // Verify the structure of exportData
    if (!exportData.users) {
      console.log('No "users" field found in exportData. Exiting...');
      return;
    }
    if (!exportData.contributions) {
      console.log('No "contributions" field found in exportData. Proceeding without contributions...');
    }

    // Step 1: Migrate users and their posts
    console.log('Migrating users and posts...');
    const userCount = Object.keys(exportData.users).length;
    if (userCount === 0) {
      console.log('No users found in exportData.users.');
    } else {
      console.log(`Found ${userCount} users in exportData.users.`);
    }

    for (const userId in exportData.users) {
      const userData = exportData.users[userId];
      const posts = userData.posts || [];

      // Update user document (remove posts array, add postsCount)
      const newUserData = {
        username: userData.username || 'Anonymous',
        profilePic: userData.profilePic || '',
        bio: userData.bio || '',
        followers: userData.followers || [],
        following: userData.following || [],
        postsCount: posts.length,
        savedPosts: userData.savedPosts || [],
      };
      console.log(`Creating /new_users/${userId} with postsCount: ${posts.length}`);
      await db.collection('new_users').doc(userId).set(newUserData);

      // Step 2: Migrate posts to /new_posts with generated postId
      if (posts.length === 0) {
        console.log(`No posts found for user ${userId}.`);
      } else {
        console.log(`Migrating ${posts.length} posts for user ${userId}...`);
      }

      for (const post of posts) {
        const postId = post.createdAt || new Date().toISOString(); // Fallback: 2025-05-28T02:02:00.000Z
        const postRef = db.collection('new_posts').doc(postId);

        await postRef.set({
          userId: userId,
          createdAt: post.createdAt || postId,
          aiGeneratedUrl: post.aiGeneratedUrl || '',
          caption: post.caption || '',
          modelUsed: post.modelUsed || '',
          promptUsed: post.promptUsed || '',
          chatLink: post.chatLink || '',
          username: userData.username || 'Anonymous',
          originalUrl: post.originalUrl || '',
          likesCount: (post.likedBy || []).length,
          commentsCount: (post.comments || []).length,
        });
        console.log(`Created /new_posts/${postId}`);

        // Migrate likes
        const likedBy = post.likedBy || [];
        for (const likerId of likedBy) {
          await postRef.collection('likes').doc(likerId).set({
            userId: likerId,
            timestamp: post.createdAt || postId,
          });
        }

        // Migrate comments (if any)
        const comments = post.comments || [];
        for (const comment of comments) {
          const commentRef = postRef.collection('comments').doc();
          await commentRef.set({
            userId: comment.userId,
            username: comment.username || 'Anonymous',
            profilePic: comment.profilePic || '',
            comment: comment.comment,
            timestamp: comment.timestamp || postId,
            likesCount: (comment.likes || []).length,
          });

          const commentLikes = comment.likes || [];
          for (const likerId of commentLikes) {
            await commentRef.collection('likes').doc(likerId).set({
              userId: likerId,
              timestamp: post.createdAt || postId,
            });
          }

          const replies = comment.replies || [];
          for (const reply of replies) {
            await commentRef.collection('replies').doc().set({
              userId: reply.userId,
              username: reply.username || 'Anonymous',
              profilePic: reply.profilePic || '',
              comment: reply.comment,
              timestamp: reply.timestamp || postId,
              likesCount: (reply.likes || []).length,
            });
          }
        }
      }
    }

    // Step 3: Migrate contributions
    console.log('Migrating contributions...');
    if (!exportData.contributions) {
      console.log('No contributions to migrate.');
      return;
    }

    const contributionCount = Object.keys(exportData.contributions).length;
    if (contributionCount === 0) {
      console.log('No contributions found in exportData.contributions.');
    } else {
      console.log(`Found ${contributionCount} contributions in exportData.contributions.`);
    }

    for (const contributionId in exportData.contributions) {
      const contributionData = exportData.contributions[contributionId];
      const nodes = contributionData.nodes || [];
      const updatedNodes = [];

      for (const node of nodes) {
        let newPostId = node.createdAt;
        if (!newPostId) {
          newPostId = new Date().toISOString();
        }

        updatedNodes.push({
          ...node,
          id: newPostId,
        });
      }

      const updatedEdges = (contributionData.edges || []).map(edge => ({
        ...edge,
        source: edge.source === '1' ? '1' : (exportData.contributions[contributionId].nodes.find(n => n.id === edge.source)?.createdAt || edge.source),
        target: exportData.contributions[contributionId].nodes.find(n => n.id === edge.target)?.createdAt || edge.target,
      }));

      console.log(`Creating /new_contributions/${contributionId}`);
      await db.collection('new_contributions').doc(contributionId).set({
        nodes: updatedNodes,
        edges: updatedEdges,
      });
    }

    console.log('Firestore migration completed successfully!');
  } catch (error) {
    console.error('Firestore migration failed:', error);
  }
}

migrateFirestoreData();