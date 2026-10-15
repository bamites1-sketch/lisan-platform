const https = require('https');

async function createTestRecordings() {
  console.log('🎤 Creating test voice recordings for admin panel...\n');
  
  const backend = 'https://readpath-backend.vercel.app';
  
  const makeRequest = (method, path, data = null, headers = {}) => {
    return new Promise((resolve) => {
      const options = {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = https.request(`${backend}${path}`, options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', (err) => resolve({ error: err.message }));
      req.setTimeout(15000, () => {
        req.destroy();
        resolve({ error: 'timeout' });
      });

      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  };

  try {
    // Step 1: Login as admin to get token
    console.log('1️⃣ Logging in as admin...');
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@lisan.com',
      password: 'LiSAN2026!'
    });

    if (loginResult.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginResult)}`);
    }

    const token = loginResult.data.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Create a test assessment
    console.log('\n2️⃣ Creating test assessment...');
    const assessment = await makeRequest('POST', '/api/admin/assessments', {
      title: 'Reading Fluency Test - Grade 3',
      description: 'A simple reading fluency assessment for testing voice recordings',
      passage: `The sun was shining brightly in the clear blue sky. Birds were singing in the trees, and flowers were blooming in the garden. Sarah walked to school with her backpack full of books. She was excited about the new day ahead.`,
      grade: 'GRADE_3',
      skillAreas: ['fluency', 'accuracy'],
      instructions: 'Please read the passage out loud clearly and at your natural pace.',
      status: 'PUBLISHED'
    }, { Authorization: `Bearer ${token}` });

    if (assessment.status !== 201) {
      console.log('Assessment creation result:', assessment);
    }

    let assessmentId;
    if (assessment.status === 201) {
      assessmentId = assessment.data.data.id;
      console.log('✅ Test assessment created:', assessmentId);
    } else {
      // Try to find existing assessment
      console.log('📋 Looking for existing assessment...');
      const existingAssessments = await makeRequest('GET', '/api/admin/assessments', null, { Authorization: `Bearer ${token}` });
      
      if (existingAssessments.status === 200 && existingAssessments.data.data.length > 0) {
        assessmentId = existingAssessments.data.data[0].id;
        console.log('✅ Using existing assessment:', assessmentId);
      } else {
        throw new Error('Could not create or find assessment');
      }
    }

    // Step 3: Create a test student
    console.log('\n3️⃣ Creating test student...');
    const studentResult = await makeRequest('POST', '/api/admin/users', {
      email: 'teststudent@example.com',
      firstName: 'Test',
      lastName: 'Student',
      role: 'STUDENT',
      grade: 'GRADE_3'
    }, { Authorization: `Bearer ${token}` });

    let studentId;
    if (studentResult.status === 201) {
      const userId = studentResult.data.data.id;
      const studentProfile = studentResult.data.data.student;
      studentId = studentProfile.id;
      console.log('✅ Test student created:', studentId);
    } else {
      console.log('Student creation result:', studentResult);
      // Try to find existing student
      const students = await makeRequest('GET', '/api/admin/students', null, { Authorization: `Bearer ${token}` });
      if (students.status === 200 && students.data.data.length > 0) {
        studentId = students.data.data[0].id;
        console.log('✅ Using existing student:', studentId);
      } else {
        throw new Error('Could not create or find student');
      }
    }

    // Step 4: Create assessment submission with mock audio
    console.log('\n4️⃣ Creating assessment submission with audio recording...');
    
    // First, create the submission
    const submissionData = {
      assessmentId: assessmentId,
      studentId: studentId,
      audioUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUWqvs8qNcEQg+ltryxnkpBSl+zO/eizEIHm7A7+OZURE', // Mock audio data
      duration: 45,
      responses: JSON.stringify([])
    };

    // We need to simulate the multipart upload since we can't easily create a real audio file
    // Instead, let's directly create a submission record in the database using a different approach
    
    console.log('Creating direct submission...');
    const directSubmission = await makeRequest('POST', '/api/setup/create-test-submission', {
      assessmentId: assessmentId,
      studentId: studentId,
      audioData: 'data:audio/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4EEQoWBAhhTgGcBAAAAAAAVkhFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEElTDZ1OsggEwTbuMU6uEHFO7a1OsggG7j1OrhB1TuWtTrIIF', // Mock WebM data
      duration: 45
    });

    if (directSubmission.status === 200) {
      console.log('✅ Test submission with audio created successfully!');
    } else {
      console.log('❌ Direct submission failed:', directSubmission);
    }

    // Step 5: Verify recordings are available in admin panel
    console.log('\n5️⃣ Checking if recordings appear in admin panel...');
    const recordings = await makeRequest('GET', '/api/admin/recordings', null, { Authorization: `Bearer ${token}` });
    
    console.log('Recordings result:', recordings);
    
    if (recordings.status === 200 && recordings.data.data.length > 0) {
      console.log(`✅ SUCCESS! Found ${recordings.data.data.length} recording(s) in admin panel`);
      console.log('\n🎯 You can now check the admin panel at:');
      console.log('🔗 Frontend: https://readpath-frontend.vercel.app/admin');
      console.log('📝 Login with: admin@lisan.com / LiSAN2026!');
      console.log('🎤 Go to "Recordings" tab to review the test submission');
    } else {
      console.log('❌ No recordings found in admin panel');
      console.log('This might be because the submission creation failed or there are no audio files yet.');
    }

  } catch (error) {
    console.error('❌ Error creating test recordings:', error.message);
    console.log('\n💡 You may need to:');
    console.log('1. Have students complete assessments with voice recordings');
    console.log('2. Or manually add assessment submissions to the database');
  }
}

createTestRecordings().catch(console.error);