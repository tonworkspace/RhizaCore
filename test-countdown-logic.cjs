// Test script to verify the countdown logic for February 1st, 2026

function testCountdownLogic() {
  console.log('🕒 Testing Burn Deadline Countdown Logic...\n');

  // Set target date to February 1st, 2026
  const targetDate = new Date('2026-02-01T23:59:59.999Z');
  const startDate = new Date('2026-01-13T00:00:00.000Z'); // Current date
  
  console.log(`Target Date: ${targetDate.toISOString()}`);
  console.log(`Start Date: ${startDate.toISOString()}`);
  
  // Test with current date (January 13, 2026)
  const now = new Date('2026-01-13T12:00:00.000Z'); // Noon on Jan 13
  
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff > 0) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Calculate percentage
    const totalDuration = targetDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const percentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    
    console.log(`\n📊 Countdown Results:`);
    console.log(`Days remaining: ${days}`);
    console.log(`Hours remaining: ${hours}`);
    console.log(`Minutes remaining: ${minutes}`);
    console.log(`Seconds remaining: ${seconds}`);
    console.log(`Progress percentage: ${percentage.toFixed(2)}%`);
    
    // Calculate total days between start and target
    const totalDays = Math.floor(totalDuration / (1000 * 60 * 60 * 24));
    console.log(`\n📅 Duration Info:`);
    console.log(`Total days from Jan 13 to Feb 1: ${totalDays} days`);
    console.log(`Days elapsed: ${Math.floor(elapsed / (1000 * 60 * 60 * 24))}`);
    console.log(`Days remaining: ${days}`);
    
    // Test edge cases
    console.log(`\n🧪 Edge Case Tests:`);
    
    // Test at start date
    const startElapsed = startDate.getTime() - startDate.getTime();
    const startPercentage = Math.max(0, Math.min(100, (startElapsed / totalDuration) * 100));
    console.log(`At start date (Jan 13): ${startPercentage.toFixed(2)}% (should be 0%)`);
    
    // Test at end date
    const endElapsed = targetDate.getTime() - startDate.getTime();
    const endPercentage = Math.max(0, Math.min(100, (endElapsed / totalDuration) * 100));
    console.log(`At end date (Feb 1): ${endPercentage.toFixed(2)}% (should be 100%)`);
    
    // Test halfway point
    const halfwayTime = startDate.getTime() + (totalDuration / 2);
    const halfwayElapsed = halfwayTime - startDate.getTime();
    const halfwayPercentage = Math.max(0, Math.min(100, (halfwayElapsed / totalDuration) * 100));
    const halfwayDate = new Date(halfwayTime);
    console.log(`At halfway point (${halfwayDate.toDateString()}): ${halfwayPercentage.toFixed(2)}% (should be ~50%)`);
    
  } else {
    console.log('❌ Deadline has passed!');
  }
  
  console.log('\n✅ Countdown logic test completed!');
}

// Run the test
testCountdownLogic();