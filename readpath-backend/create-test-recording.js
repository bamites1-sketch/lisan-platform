const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createTestRecording() {
  try {
    console.log('🎤 Creating test recording...');
    
    // Find a student to assign the recording to
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: { student: true }
    });
    
    if (!student || !student.student) {
      console.error('❌ No student found');
      return;
    }
    
    console.log(`📝 Using student: ${student.student.firstName} ${student.student.lastName}`);
    
    // Create uploads directory structure
    const uploadsDir = path.join(__dirname, 'uploads', 'recordings');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory');
    }
    
    // Create a small test audio file (just create an empty .webm file for testing)
    const fileName = `${Date.now()}-test-recording.webm`;
    const filePath = path.join(uploadsDir, fileName);
    const audioKey = `recordings/${fileName}`;
    
    // Write a minimal WebM file (this won't be a valid audio file but will test the system)
    const testContent = Buffer.from('TEST-AUDIO-FILE-FOR-DEMO');
    fs.writeFileSync(filePath, testContent);
    console.log('🎵 Created test audio file');
    
    // Create assessment submission with this audio
    const assessment = await prisma.assessment.findFirst();
    
    let submissionData;
    
    if (assessment) {
      // Update existing assessment submission or create new one
      let submissionData = await prisma.assessmentSubmission.findFirst({
        where: {
          assessmentId: assessment.id,
          studentId: student.student.id
        }
      });
      
      if (submissionData) {
        // Update existing submission
        submissionData = await prisma.assessmentSubmission.update({
          where: { id: submissionData.id },
          data: {
            audioUrl: audioKey,
            duration: 30,
            status: 'SUBMITTED',
            submittedAt: new Date()
          }
        });
        console.log('✅ Updated existing assessment submission with new audio');
      } else {
        // Create new submission
        submissionData = await prisma.assessmentSubmission.create({
          data: {
            assessmentId: assessment.id,
            studentId: student.student.id,
            audioUrl: audioKey,
            duration: 30,
            status: 'SUBMITTED',
            submittedAt: new Date()
          }
        });
        console.log('✅ Created assessment submission with audio');
      }
    } else {
      // Create fluency recording instead
      submissionData = await prisma.fluencyRecording.create({
        data: {
          studentId: student.student.id,
          passageTitle: 'Test Reading Passage',
          audioUrl: audioKey,
          durationSeconds: 30,
          wpm: 0,
          accuracy: 0,
          cwpm: 0,
          totalWords: 50,
          pauseCount: 0,
          hesitationCount: 0,
          score: 0
        }
      });
      console.log('✅ Created fluency recording with audio');
    }
    
    console.log('🎉 Test recording created successfully!');
    console.log('📊 Recording details:');
    console.log(`   ID: ${submissionData.id}`);
    console.log(`   Student: ${student.student.firstName} ${student.student.lastName}`);
    console.log(`   Audio Key: ${audioKey}`);
    console.log(`   File Path: ${filePath}`);
    console.log('');
    console.log('🎧 You can now test the admin recordings tab!');
    console.log('🌐 Open: http://localhost:3000/admin/dashboard');
    console.log('📋 Go to: Voice Recordings tab');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRecording();