// Quick test to diagnose completeAssessment crash
const { PrismaClient } = require('@prisma/client')
const { calculateReadinessScore, generateDiagnostics, generateLearningPlan } = require('./dist/services/diagnostic.service')
const p = new PrismaClient()

async function main() {
  // Find any in-progress assessment
  const a = await p.assessment.findFirst({ where: { status: 'IN_PROGRESS' }, include: { responses: { include: { question: true } }, student: true } })
  if (!a) { console.log('No in-progress assessments'); return }
  console.log('Assessment:', a.id, 'Student grade:', a.student.grade)
  console.log('Responses:', a.responses.length)
  
  try {
    const scores = await calculateReadinessScore(a.responses)
    console.log('Scores:', scores)
    const diag = generateDiagnostics(scores, a.student.grade)
    console.log('Diagnostics: strengths:', diag.strengths.length, 'weaknesses:', diag.weaknesses.length)
    const plan = generateLearningPlan(diag, a.student.grade)
    console.log('Plan weeks:', plan.length)
    console.log('SUCCESS: diagnostic service works correctly')
  } catch(e) {
    console.error('DIAGNOSTIC ERROR:', e.message, e.code)
  }
}
main().finally(() => p.$disconnect())
