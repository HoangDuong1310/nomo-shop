#!/bin/bash

# Script để monitor và tự động fix các vấn đề PM2
# File: monitor-app.sh

APP_NAME="cloud-shop"
LOG_FILE="/var/www/html/nomo-shop/logs/monitor.log"
MAX_RESTARTS=5

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

check_app_health() {
    # Kiểm tra PM2 app status
    local status=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null)
    
    if [ "$status" != "online" ]; then
        log_message "WARNING: App $APP_NAME is not online (status: $status)"
        return 1
    fi
    
    # Kiểm tra HTTP response
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
    
    if [ "$http_status" != "200" ]; then
        log_message "WARNING: HTTP check failed (status: $http_status)"
        return 1
    fi
    
    # Kiểm tra static files
    local static_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/images/placeholder.svg || echo "000")
    
    if [ "$static_status" != "200" ]; then
        log_message "WARNING: Static files not accessible (status: $static_status)"
        return 1
    fi
    
    return 0
}

restart_app() {
    log_message "Attempting to restart $APP_NAME..."
    
    # Stop all instances
    pm2 stop $APP_NAME 2>/dev/null
    pm2 delete $APP_NAME 2>/dev/null
    
    # Start fresh instance
    cd /var/www/html/nomo-shop
    pm2 start npm --name $APP_NAME -- start
    
    sleep 10
    
    if check_app_health; then
        log_message "SUCCESS: App restarted successfully"
        return 0
    else
        log_message "ERROR: App still unhealthy after restart"
        return 1
    fi
}

# Main monitoring loop
log_message "Starting monitor for $APP_NAME"

restart_count=0

while true; do
    if ! check_app_health; then
        if [ $restart_count -lt $MAX_RESTARTS ]; then
            restart_app
            restart_count=$((restart_count + 1))
        else
            log_message "ERROR: Max restart attempts reached. Manual intervention required."
            exit 1
        fi
    else
        log_message "OK: App is healthy"
        restart_count=0
    fi
    
    sleep 60  # Check every minute
done
