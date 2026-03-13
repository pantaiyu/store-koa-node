import app from './app.js'
import { port } from './config/index.js'

app.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})
