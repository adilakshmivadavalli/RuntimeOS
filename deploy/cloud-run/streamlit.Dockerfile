FROM python:3.12-slim
WORKDIR /app
COPY snowflake/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY snowflake /app/snowflake
CMD exec streamlit run /app/snowflake/streamlit/app.py --server.port ${PORT:-8080} --server.address 0.0.0.0
