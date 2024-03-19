const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const databasePath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())

let database = null

const initializeAndSever = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeAndSever()

const convertDbtoResponseStates = each => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  }
}

app.get('/states/', async (request, response) => {
  const getQuery = `
  SELECT * FROM state`
  const array = await database.all(getQuery)
  response.send(array.map(each => convertDbtoResponseStates(each)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getQuery = `
  SELECT * FROM state
  WHERE state_id=${stateId}`
  const state = await database.get(getQuery)
  response.send(convertDbtoResponseStates(state))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postQuery = `
  INSERT INTO district
  (district_name,state_id,cases,cured,active,deaths)
  VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths})`
  await database.run(postQuery)
  response.send('District Successfully Added')
})
const convertDbtoResponse = district => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  }
}

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getQuery = `
    SELECT * FROM district
    WHERE district_id=${districtId}`
  const district = await database.get(getQuery)
  response.send(convertDbtoResponse(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE FROM district
  WHERE district_id=${districtId};`
  await database.run(deleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const {districtId} = request.params
  const putQuery = `
  UPDATE 
   district
  SET 
   district_name='${districtName}',
   state_id=${stateId},
   cases=${cases},
   cured=${cured},
   active=${active},
   deaths=${deaths}
  WHERE district_id=${districtId};`
  await database.run(putQuery)
  response.send('District Details Updated')
})

module.exports = app
