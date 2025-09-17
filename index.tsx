import { Hono } from 'hono'

const app = new Hono()

const Layout = ({ children }: { children: any }) => (
  <html>
    <head>
      <title>My Hono App</title>
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    </head>
    <body>{children}</body>
  </html>
)

app.get('/', (c) => {
  return c.html(
    <Layout>
      <div>
        <h1>Hello Hono + HTMX!</h1>
        <button hx-get="/time" hx-target="#time">Get Time</button>
        <div id="time"></div>
      </div>
    </Layout>
  )
})

app.get('/time', (c) => {
  return c.html(<p>Current time: {new Date().toLocaleTimeString()}</p>)
})

export default app
