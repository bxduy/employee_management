import redis from 'redis'

const redisClient = redis.createClient()

redisClient.connect()

redisClient.on("connect", function () {
    console.log("Redis client connected")
})

redisClient.on("error", function (err) {
    console.error("Error in Redis connection:", err)
})

export default redisClient