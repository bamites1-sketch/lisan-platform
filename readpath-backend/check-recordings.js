const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecordings() {
  try {
    console.log('🔍 Checking recordings in database...\n');
    
    // Check fluency recordings
    const recordings = await prisma.fluencyRecording.findMany({
      orderBy: { recordedAt: 'desc' }
    });
    
    console.log(`📊 Total recordings found: ${recordings.length}\n`);
    
    if (recordings.length > 0) {
      console.log('📋 Recording details:');
      for (let i = 0; i < Math.min(5, recordings.length); i++) {
        const r = recordings[i];
        // Get student info
        const student = await prisma.student.findUnique({
          where: { id: r.studentId },
          select: { firstName: true, lastName: true, grade: true }
        });
        
        console.log(`${i + 1}. Student: ${student?.firstName} ${student?.lastName} (${student?.grade})`);
        console.log(`   Passage: ${r.passageTitle}`);
        console.log(`   Audio URL: ${r.audioUrl || 'No audio'}`);
        console.log(`   Score: ${r.score}`);
        console.log(`   Reviewed: ${r.reviewed ? 'Yes' : 'No'}`);
        console.log(`   Recorded: ${r.recordedAt}`);
        console.log('');
      }
    } else {
      console.log('❌ No recordings found in database');
    }
    
    // Check assessment submissions with audio
    console.log('🔍 Checking assessment submissions with audio...\n');
    const submissions = await prisma.assessmentSubmission.findMany({
      where: {
        audioUrl: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Assessment submissions with audio: ${submissions.length}\n`);
    
    if (submissions.length > 0) {
      console.log('📋 Assessment audio details:');
      for (let i = 0; i < Math.min(3, submissions.length); i++) {
        const s = submissions[i];
        const student = await prisma.student.findUnique({
          where: { id: s.studentId },
          select: { firstName: true, lastName: true }
        });
        
        console.log(`${i + 1}. Student: ${student?.firstName} ${student?.lastName}`);
        console.log(`   Audio URL: ${s.audioUrl}`);
        console.log(`   Status: ${s.status}`);
        console.log(`   Created: ${s.createdAt}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecordings();