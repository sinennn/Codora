/**
 * Curriculum Extractor for Codora
 * Parses roadmap.sh data into Codora's curriculum format
 * 
 * Run: node scripts/extract-curriculum.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CURRICULUM_DIR = path.join(__dirname, '../curriculum_and_materials');
const OUTPUT_DIR = path.join(__dirname, '../src/Data/Curriculum');

// Roadmaps we want to include (focused on programming)
const INCLUDED_ROADMAPS = [
  'javascript',
  'typescript', 
  'react',
  'nodejs',
  'python',
  'java',
  'golang',
  'rust',
  'cpp',
  'frontend',
  'backend',
  'full-stack',
  'android',
  'ios',
  'flutter',
  'react-native',
  'datastructures-and-algorithms',
  'sql',
  'mongodb',
  'git-github',
  'docker',
  'html',
  'css',
];

// Parse frontmatter from markdown
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };
  
  const frontmatterStr = match[1];
  const body = content.slice(match[0].length).trim();
  
  const frontmatter = {};
  let currentKey = null;
  let currentValue = [];
  let inArray = false;
  
  frontmatterStr.split('\n').forEach(line => {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch && !line.startsWith('  ')) {
      if (currentKey) {
        frontmatter[currentKey] = inArray ? currentValue : currentValue.join('\n').trim();
      }
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      if (value === '' || value === '|') {
        currentValue = [];
        inArray = false;
      } else if (value.startsWith('[')) {
        // Inline array
        frontmatter[currentKey] = value.replace(/[\[\]']/g, '').split(',').map(s => s.trim());
        currentKey = null;
      } else {
        frontmatter[currentKey] = value.replace(/^['"]|['"]$/g, '');
        currentKey = null;
      }
    } else if (line.startsWith('  - ')) {
      inArray = true;
      currentValue.push(line.replace('  - ', '').replace(/^['"]|['"]$/g, ''));
    } else if (currentKey && line.startsWith('  ')) {
      currentValue.push(line.trim());
    }
  });
  
  if (currentKey) {
    frontmatter[currentKey] = inArray ? currentValue : currentValue.join('\n').trim();
  }
  
  return { frontmatter, body };
}

// Extract topics from roadmap JSON
function extractTopicsFromJson(jsonPath) {
  try {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    
    const topics = [];
    const nodes = data.nodes || [];
    
    nodes.forEach(node => {
      if (node.type === 'topic' || node.type === 'subtopic') {
        const label = node.data?.label;
        if (label && !label.includes('Roadmap') && !label.includes('roadmap.sh')) {
          topics.push({
            id: node.id,
            name: label,
            type: node.type,
            position: node.position?.y || 0, // Use Y position for ordering
          });
        }
      }
    });
    
    // Sort by Y position (top to bottom = learning order)
    topics.sort((a, b) => a.position - b.position);
    
    return topics;
  } catch (error) {
    console.error(`Error parsing ${jsonPath}:`, error.message);
    return [];
  }
}

// Extract content for a topic
function extractTopicContent(roadmapDir, topicId) {
  const contentDir = path.join(roadmapDir, 'content');
  if (!fs.existsSync(contentDir)) return null;
  
  const files = fs.readdirSync(contentDir);
  const matchingFile = files.find(f => f.includes(topicId));
  
  if (!matchingFile) return null;
  
  const content = fs.readFileSync(path.join(contentDir, matchingFile), 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  
  // Extract title and resources from body
  const lines = body.split('\n');
  const title = lines[0]?.replace(/^#\s*/, '') || '';
  
  // Find resource links
  const resources = [];
  lines.forEach(line => {
    const linkMatch = line.match(/\[@(\w+)@([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      resources.push({
        type: linkMatch[1],
        title: linkMatch[2],
        url: linkMatch[3],
      });
    }
  });
  
  // Get description (text between title and resources)
  const descLines = [];
  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith('# ')) {
      foundTitle = true;
      continue;
    }
    if (line.includes('Visit the following') || line.startsWith('- [@')) break;
    if (foundTitle && line.trim()) {
      descLines.push(line);
    }
  }
  
  return {
    title,
    description: descLines.join(' ').trim(),
    resources,
  };
}

// Process a single roadmap
function processRoadmap(roadmapId) {
  const roadmapDir = path.join(CURRICULUM_DIR, 'roadmaps', roadmapId);
  if (!fs.existsSync(roadmapDir)) {
    console.log(`  Skipping ${roadmapId} - directory not found`);
    return null;
  }
  
  // Read metadata
  const mdPath = path.join(roadmapDir, `${roadmapId}.md`);
  const jsonPath = path.join(roadmapDir, `${roadmapId}.json`);
  
  if (!fs.existsSync(mdPath)) {
    console.log(`  Skipping ${roadmapId} - no metadata file`);
    return null;
  }
  
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  const { frontmatter } = parseFrontmatter(mdContent);
  
  // Extract topics from JSON
  const topics = fs.existsSync(jsonPath) ? extractTopicsFromJson(jsonPath) : [];
  
  // Enrich topics with content
  const enrichedTopics = topics.map(topic => {
    const content = extractTopicContent(roadmapDir, topic.id);
    return {
      ...topic,
      ...content,
    };
  }).filter(t => t.title); // Only keep topics with content
  
  // Group into modules (main topics with their subtopics)
  const modules = [];
  let currentModule = null;
  
  enrichedTopics.forEach(topic => {
    if (topic.type === 'topic') {
      if (currentModule) modules.push(currentModule);
      currentModule = {
        id: `${roadmapId}_${topic.id}`,
        name: topic.name,
        description: topic.description || '',
        lessons: [],
      };
    } else if (topic.type === 'subtopic' && currentModule) {
      currentModule.lessons.push({
        id: `${roadmapId}_${topic.id}`,
        title: topic.title || topic.name,
        description: topic.description || '',
        resources: topic.resources || [],
        xpReward: 25,
      });
    }
  });
  
  if (currentModule) modules.push(currentModule);
  
  return {
    id: roadmapId,
    name: frontmatter.briefTitle || frontmatter.title || roadmapId,
    description: frontmatter.briefDescription || frontmatter.description || '',
    difficulty: 'beginner',
    estimatedHours: modules.length * 2,
    modules,
    relatedRoadmaps: frontmatter.relatedRoadmaps || [],
  };
}

// Process projects
function processProjects() {
  const projectsDir = path.join(CURRICULUM_DIR, 'projects');
  if (!fs.existsSync(projectsDir)) return [];
  
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    
    return {
      id: file.replace('.md', ''),
      title: frontmatter.title || file.replace('.md', ''),
      description: frontmatter.description || '',
      difficulty: frontmatter.difficulty || 'beginner',
      skills: frontmatter.skills || [],
      roadmapIds: frontmatter.roadmapIds || [],
      content: body,
    };
  });
}

// Main execution
async function main() {
  console.log('🚀 Extracting curriculum data from roadmap.sh...\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Process roadmaps
  console.log('📚 Processing roadmaps...');
  const roadmaps = [];
  
  for (const roadmapId of INCLUDED_ROADMAPS) {
    console.log(`  Processing: ${roadmapId}`);
    const roadmap = processRoadmap(roadmapId);
    if (roadmap && roadmap.modules.length > 0) {
      roadmaps.push(roadmap);
      console.log(`    ✓ ${roadmap.modules.length} modules, ${roadmap.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons`);
    }
  }
  
  // Process projects
  console.log('\n📋 Processing projects...');
  const projects = processProjects();
  console.log(`  ✓ ${projects.length} projects extracted`);
  
  // Write output files
  console.log('\n💾 Writing output files...');
  
  // Write individual roadmap files
  roadmaps.forEach(roadmap => {
    const filePath = path.join(OUTPUT_DIR, `${roadmap.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(roadmap, null, 2));
    console.log(`  ✓ ${roadmap.id}.json`);
  });
  
  // Write roadmap index
  const index = roadmaps.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    moduleCount: r.modules.length,
    lessonCount: r.modules.reduce((sum, m) => sum + m.lessons.length, 0),
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
  console.log('  ✓ index.json');
  
  // Write projects
  fs.writeFileSync(path.join(OUTPUT_DIR, 'projects.json'), JSON.stringify(projects, null, 2));
  console.log('  ✓ projects.json');
  
  console.log('\n✅ Curriculum extraction complete!');
  console.log(`   ${roadmaps.length} roadmaps`);
  console.log(`   ${roadmaps.reduce((sum, r) => sum + r.modules.length, 0)} total modules`);
  console.log(`   ${roadmaps.reduce((sum, r) => sum + r.modules.reduce((s, m) => s + m.lessons.length, 0), 0)} total lessons`);
  console.log(`   ${projects.length} projects`);
}

main().catch(console.error);
