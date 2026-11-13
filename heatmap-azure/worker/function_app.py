"""Ride Heatmap worker (Azure Functions, Python v2 model, Flex Consumption)."""
import json
import logging

import azure.functions as func

import jobs

app = func.FunctionApp()


# 11:00 UTC = 6:00 Toronto in winter, 7:00 in summer (Linux plans run cron in UTC).
@app.timer_trigger(arg_name="timer", schedule="0 0 11 * * *", run_on_startup=False)
def morning_refresh(timer: func.TimerRequest) -> None:
    logging.info("morning refresh starting")
    jobs.refresh_all()


# Jobs from the API: set-key, delete-key, refresh, purge-user, publish-key.
@app.queue_trigger(arg_name="msg", queue_name="jobs", connection="AzureWebJobsStorage")
def job(msg: func.QueueMessage) -> None:
    jobs.handle(json.loads(msg.get_body()))
