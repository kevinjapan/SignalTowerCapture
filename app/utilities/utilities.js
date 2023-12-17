

const get_random_int = (min_value = 5, max_value = 15) => {
   const value = min_value + Math.floor(Math.random() * (max_value - min_value))
   return value
}




module.exports = {
   get_random_int,
}