import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('MongoDB Connected')
  } catch (error) {
    // Helpful diagnostics for common SRV / DNS issues when using Atlas placeholder URIs
    if (error && (error.code === 'ENOTFOUND' || /querySrv/i.test(String(error.message)))) {
      console.error('MongoDB Error: failed to resolve SRV host. Check your MONGO_URI. Example local URI: mongodb://127.0.0.1:27017/secure_vote')
      console.error('If you are using an Atlas URI, replace "cluster.mongodb.net" and credentials with your cluster values, or use a standard connection string.')
      console.error('Original error:', error.message)
      process.exit(1)
    }

    console.error('MongoDB Error:', error)
    process.exit(1)
  }
}

export default connectDB

