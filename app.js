const faker = require('faker');
const express = require('express');
const cors = require('cors');
const _ = require('lodash');
const bodyParser = require('body-parser');
const app = express();
const port = 8082;

// set the view engine to ejs
app.set('view engine', 'ejs');

// app.use(cors());
app.use(cors({ origin: ['http://localhost:9000'] , credentials :  true}));

// parse application/json
app.use(bodyParser.json())

const data = [];
const events = [];
const operations = [];
const agents = [];
const contactGroups = [];
const states = ['INVALID', 'NO_DATA', 'UNKNOWN', 'OK', 'WARNING', 'CRITICAL'];
const filters = ['Opersense OK', 'Opersense not OK', 'No filter'];
const deliveries = ['Email', 'SMS', 'Email+SMS', 'Trap Inform'];

for(let i = 0; i < 10; i++){
	operations.push(faker.name.jobType());
	agents.push(faker.finance.transactionType());
	contactGroups.push(faker.random.word());
}

for(let i = 1; i < 30; i++){
	let state = states[_.random(0, states.length - 1)];
	let opersenseFilter = state === 'CRITICAL' ? filters[_.random(0, filters.length - 1)] : _.last(filters);
	events.push({
		"id": i, 
		"name": faker.name.findName(), 
		"nbStates":_.random(1, 10),
		"state": state,
		"opersenseFilter": opersenseFilter
	})
}

for(let i = 1; i < 99; i++){
	let event = events[_.random(0, events.length - 1)];
	data.push({
		"id": i, 
		"name": faker.name.findName(), 
		"description": faker.random.words(),
		"dataSourceType": faker.name.findName(),
		"event": event.state,
		"delivery": deliveries[_.random(0, deliveries.length - 1)],
		"nbMeasures": event.nbStates,
		"contactGroups": contactGroups.slice(0, _.random(0, contactGroups.length - 1)),
		"activated": faker.random.boolean(),
		"date": faker.date.past()
	});
}


app.get('/operations', (req, res) => {
	res.send(operations);
});


app.get('/agents', (req, res) => {
	res.send(agents);
});


// Smart Alert
app.get('/smartAlerts', (req, res) => {
	console.log(req.query);
	let page = req.query.page || 0;
	let limit = req.query.limit || 10;
	let filter = req.query.filter;
	let _ret = data;

	page = page * limit;
	limit = page + limit;
	if(!_.isEmpty(filter.measurement)){
		_ret = _.filter(_ret, {name: filter.measurement})
	}
	res.json({
		count: _ret.length,
		results: _ret.slice(page, limit)
	});
});

app.post('/smartAlerts/search', (req, res) => {
	console.log(req.body);
	let page = req.body.page || 0;
	let limit = req.body.limit || 10;
	let filter = req.body.filter;
	let _ret = data;

	page = page * limit;
	limit = page + limit;
	if(!_.isEmpty(filter.measurement)){
		_ret = _.filter(_ret, {name: filter.measurement})
	}
	res.json({
		count: _ret.length,
		results: _ret.slice(page, limit)
	});
});

app.put('/smartAlerts', (req, res) => {
	let body = req.body[0];
	let i = _.findIndex(data, {id: body.id});
	data[i] = body;
	
	res.json({
		message: 'OK',
		data: data[i]
	});
});

app.delete('/smartAlerts/:id', (req, res) => {
	let id = +req.params.id;
	let i = _.findIndex(data, {id: id});
	let d = data.splice(i, 1);
	res.json({
		message: 'OK',
		data: d
	});
});



// Events
app.get('/events/:id', (req, res) => {
	let id = +req.params.id;
	let event = _.find(events, {id: id});
	res.send(event);
});

app.get('/events', (req, res) => {
	console.log(req.query);
	let page = req.query.page || 0;
	let limit = req.query.limit || 10;
	let filter = req.query.filter;
	let _ret = events;

	page = page * limit;
	limit = page + limit;
	res.json({
		count: _ret.length,
		results: _ret.slice(page, limit)
	});
});

app.post('/events/search', (req, res) => {
	console.log(req.body);
	let page = req.body.page || 0;
	let limit = req.body.limit || 10;
	let filter = req.body.filter;
	let _ret = events;

	page = page * limit;
	limit = page + limit;
	res.json({
		count: _ret.length,
		results: _ret.slice(page, limit)
	});
});


app.post('/events', (req, res) => {
	console.log(req.body);
	let body = req.body[0];
	let lastEvent = _.last(events);
	body.id = lastEvent.id + 1;
	events.push(body);
	res.json({
		message: 'create event success',
		data: body
	});
});

app.put('/events', (req, res) => {
	console.log(req.body);
	let body = req.body[0];
	let i = _.findIndex(events, {id: body.id});
	events[i] = body;

	res.json({
		message: 'update event success',
		data: events[i]
	});
});

app.delete('/events/:id', (req, res) => {
	let id = +req.params.id;
	let i = _.findIndex(events, {id: id});
	let d = events.splice(i, 1);
	res.json({
		message: 'OK',
		data: d
	});
});


// Random words
app.use((req, res) => {
	let routes = [];
	_.each(app._router.stack, stack => {
		if(stack.route){
			routes.push({
				path: stack.route.path,
				methods: _.keys(stack.route.methods).map((o) => {
					let c = '';
					switch (o.toLowerCase()) {
						case 'get':
						c = 'label-success';
						break;
						case 'post':
						c = 'label-primary';
						break;
						case 'put':
						c = 'label-warning';
						break;
						case 'delete':
						c = 'label-danger';
						break;
						default:
						c = 'label-info';
						break;
					}
					return {name: o, c: c};
				})
			})
		}
	})
	res.render('pages/index', {
		h1: 'Faker API',
		p: faker.lorem.words(),
		routes: routes
	});
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
})