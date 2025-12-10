const db = require('./db');

class WalletAdapter {
  /**
   * Fetches the current balance for a student.
   * Connects to the 'student_schema.demo_wallets' table.
   */
  async getStudentBalance(studentId) {
    try {
      const result = await db.query(
        'SELECT balance FROM student_schema.demo_wallets WHERE student_id = $1',
        [studentId]
      );

      if (result.rows.length > 0) {
        // Return float for calculation
        return parseFloat(result.rows[0].balance);
      } else {
        console.log(`User ${studentId} restricted or not found.`);
        return 0.00; 
      }
    } catch (err) {
      console.error('Wallet Error:', err);
      // Fail safe: return 0.00 to prevent crash, allowing app to handle empty state
      return 0.00;
    }
  }
}
