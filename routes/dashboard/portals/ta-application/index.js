var express = require('express');
var router = express.Router();
var fq = require('fuzzquire');
var coursesModel = fq('schemas/courses');
var divisionsModel = fq('schemas/divisions');
var taModel = fq('schemas/ta');

const { check, validationResult } = require('express-validator/check');

router.post('/division/apply', [
	check('cgpa').exists().withMessage('No CGPA').isFloat({ min: 0.0, max: 10.0 }).withMessage('Invalid CGPA'),
	check('hours').exists().isFloat().withMessage("Invalid Hours"),
	check('division').exists().withMessage("Invalid Division")
], function (req, res, next) {

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.mapped() });
	}

	var email = req.user.email;
	var cgpa = req.sanitize(req.body.cgpa);
	var division = req.sanitize(req.body.division);
	var hours = req.sanitize(req.body.hours);

	divisionsModel.find({ name: division }, function (err, divisions) {

		if (err) {
			return res.terminate(err);
		}

		if (divisions.length == 0) {
			return res.renderState('custom_errors', {
				redirect: "/dashboard/ta-application/division",
				timeout: 5,
				supertitle: "Invalid Data",
				message: "No Division Found",
			});
		}

		taModel.create({
			student: email,
			type: "D",
			cgpa: cgpa,
			hours: hours,
			division: division
		}, function (err) {
			if (err) {
				return res.terminate(err);
			}
			res.renderState('custom_errors', {
				redirect: '/dashboard',
				timeout: 3,
				supertitle: "Request Received",
				message: "Your request has been submitted. Redirecting .."
			});
		});
	});
});

router.get('/division', function (req, res, next) {
	divisionsModel.find({}).sort({ name: 1 }).exec(function (err, divisions) {
		if (err) {
			res.terminate(err);
		}
		res.renderState('dashboard/portals/ta-application/apply-division', {
			divisions: divisions
		});
	});
});

router.get('/course', function (req, res, next) {

	coursesModel.find({}).sort({
		courseID: 1
	}).exec(function (err, courses) {
		if (err) {
			res.terminate(err);
		}
		res.renderState('dashboard/portals/ta-application/apply-course', {
			courses: courses
		});
	});
});

router.get('/', function (req, res, next) {
	res.renderState('dashboard/portals/ta-application');
});

module.exports = router;