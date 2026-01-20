// Re-export database connection from mongodb.js for backward compatibility
import connectDB from "./mongodb.js"

export { connectDB }
export default connectDB
