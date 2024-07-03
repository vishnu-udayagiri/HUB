const router = require('express').Router()

const { signUp } = require('../controller/user-controller')
const { createServices, getServices, deleteService, getSubscriptionPlans, createSubscriptionPlan, deleteSubscriptionPlan, getSubscriptionService, createSubscriptionService, deleteSubscriptionService } = require('../controller/subscription-controller')
const { newServiceValidation, subscriptionPlanValidation, subscriptionServiceValidation, clientValidation } = require('../validators/subscription-validator')
const { getClients, createClient, deleteClient } = require('../controller/clients-controller')

router.post('/signup', signUp)
router.post('/create-service', newServiceValidation, createServices)
router.get('/get-service', getServices)
router.delete('/delete-service', deleteService)

router.get('/get-subscription-plan', getSubscriptionPlans)
router.post('/create-subscription-plan', subscriptionPlanValidation, createSubscriptionPlan)
router.delete('/delete-subscription-plan', deleteSubscriptionPlan)

router.get('/get-subscription-service', getSubscriptionService)
router.post('/create-subscription-service', subscriptionServiceValidation, createSubscriptionService)
router.delete('/delete-subscription-service', deleteSubscriptionService)

router.get('/get-hub-clients', getClients)
router.post('/create-client', clientValidation, createClient)
router.delete('/delete-client', deleteClient)

router.get('/csrf-token', (req, res) => {
    res.status(200).send(";-)")
})



router.get('/test', (req, res, next) => {
    debugger
    res.status(500).response({ data: 'xxxxxxxxxxxxx' })
    next()
})

module.exports = router