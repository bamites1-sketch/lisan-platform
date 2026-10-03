const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function updateWithRetry(maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Connection attempt ${attempt}/${maxRetries}...`);
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://lisan_db_xdfu_user:PTZgRmddw7cydHua6Y3eTfD5vxxR001A@dpg-dald6hv40ujc73djsb20-a.oregon-postgres.render.com/lisan_db_xdfu?sslmode=require&connect_timeout=60&pool_timeout=60',
        },
      },
    });

    try {
      const fileBuf = fs.readFileSync('uploads/receipts/1789467066986-408170041.png');
      const dataUrl = 'data:image/png;base64,' + fileBuf.toString('base64');
      
      const sub1 = await prisma.paymentSubmission.update({
        where: { id: '44ae1f2f-1204-4d47-8678-7e57baed65da' },
        data: { receiptUrl: dataUrl }
      });
      console.log('✅ Updated submission 44ae1f2f (bb tt - PENDING) with actual payment receipt screenshot!');

      const fileBuf2 = fs.readFileSync('uploads/receipts/1789500854679-948856286.png');
      const dataUrl2 = 'data:image/png;base64,' + fileBuf2.toString('base64');
      const sub2 = await prisma.paymentSubmission.update({
        where: { id: 'a20064ce-4cf2-4aca-b22b-b0c6a65c2527' },
        data: { receiptUrl: dataUrl2 }
      });
      console.log('✅ Updated submission a20064ce (APPROVED) with actual receipt image!');

      await prisma.$disconnect();
      console.log('🎉 Successfully updated all database records!');
      return;
    } catch (err) {
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      await prisma.$disconnect().catch(() => {});
      if (attempt < maxRetries) {
        console.log('Waiting 4 seconds before retry...');
        await new Promise(r => setTimeout(r, 4000));
      } else {
        throw err;
      }
    }
  }
}

updateWithRetry().catch(err => {
  console.error('Fatal error after retries:', err);
  process.exit(1);
});
