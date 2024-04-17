import {
  Button,
  Card,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Space
} from "antd/es"
import React, { useEffect, useRef, useState } from "react"

import { ThemeProvider } from "~theme"

import { getSecretCode, storage } from "../utils/util"

const cacheToken = "googleCodePluginsToken"

type FieldType = {
  issuer?: string
  remark?: string
  secret?: string
  code?: string
  warning?: boolean
  timerCount?: number
}

function IndexPopup() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [list, setList] = useState([])
  const updateRef = useRef<FieldType[]>([])

  let timer = null

  const getCode = (secret) => {
    return getSecretCode(secret)
  }

  const getItemCode = (i) => {
    const updateData = list.map((item, idx) => {
      if (i === idx) {
        const updateItem = {
          ...item,
          code: getCode(item.secret),
          warning: false,
          timerCount: 30 * 3
        }
        return updateItem
      }
      return item
    })
    updateRef.current = updateData

    setList(updateData)
    if (timer) return
    timerFunc()
  }

  const timerFunc = () => {
    timer = setInterval(function () {
      console.log("list", updateRef.current)

      const updateData = updateRef.current.map((item) => {
        if (updateRef.current.every((v) => !v?.timerCount)) {
          clearInterval(timer)
          timer = null
          return {
            ...item,
            code: ""
          }
        }
        if (!item.timerCount) {
          return {
            ...item,
            code: ""
          }
        }
        // 更新动画
        let i = item.timerCount % 30
        return {
          ...item,
          code: 1 === i ? getCode(item.secret) : item.code,
          warning: i > 1 && i < 10 && i % 2 == 1,
          timerCount: item.timerCount - 1
        }
      })

      updateRef.current = updateData

      setList(updateData)
    }, 1000)
  }

  useEffect(() => {
    storage
      .get(cacheToken)
      .then((data) => {
        if (data) {
          const result = Object.values(data) as FieldType[]
          setList(result)
          updateRef.current = result
        }
      })
      .catch((e) => {})
      .finally(() => {})
  }, [])

  const editItem = (item) => {
    form.setFieldsValue(item)
    setIsModalOpen(true)
  }

  const handleOk = () => {
    form.validateFields().then(async (formData) => {
      const cache: FieldType = (await storage.get(cacheToken)) || {}
      cache[formData.secret] = formData
      storage.set(cacheToken, cache)
      setList(Object.values(cache))
      setIsModalOpen(false)
    })
  }
  console.log("url", window.location.href)

  const handleCancel = () => {
    form.setFieldsValue({})
    form.resetFields()
    setIsModalOpen(false)
  }

  return (
    <ThemeProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 10,
          width: 350,
          maxHeight: 600
        }}>
        <Card
          title="动态验证码"
          extra={
            <Button
              type="primary"
              size="small"
              onClick={() => {
                form.setFieldsValue({})
                setIsModalOpen(true)
              }}>
              添加
            </Button>
          }>
          <List
            bordered
            dataSource={list}
            renderItem={(item, i) => (
              <List.Item>
                <List.Item.Meta title={item.issuer} description={item.remark} />

                {item.code ? (
                  <Button
                    type="primary"
                    ghost
                    danger={item.warning}
                    onClick={() => {
                      // 复制到剪切板
                      navigator.clipboard.writeText(item.code)
                      message.success("已复制到剪切板")
                    }}>
                    {item.code}
                  </Button>
                ) : (
                  <Space direction="vertical">
                    <Button type="primary" onClick={() => getItemCode(i)}>
                      {item.timerCount === 0 ? "重新获取" : "获取验证码"}
                    </Button>
                    <Button type="primary" onClick={() => editItem(item)}>
                      编辑
                    </Button>
                    <Popconfirm
                      title="提示"
                      description="确定要删除?"
                      onConfirm={async () => {
                        const cache: FieldType =
                          (await storage.get(cacheToken)) || {}
                        delete cache[item.secret]
                        storage.set(cacheToken, cache)
                        setList(Object.values(cache))
                      }}
                      onCancel={() => {}}
                      okText="确定"
                      cancelText="取消">
                      <Button danger>删除</Button>
                    </Popconfirm>
                  </Space>
                )}
              </List.Item>
            )}
          />
        </Card>

        <Modal
          title="添加动态验证码"
          open={isModalOpen}
          onOk={handleOk}
          okText="提交"
          cancelText="取消"
          onCancel={handleCancel}>
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            style={{ maxWidth: 300 }}
            autoComplete="off">
            <Form.Item<FieldType>
              label="Service"
              name="issuer"
              rules={[{ required: true, message: "服务名称" }]}>
              <Input />
            </Form.Item>

            <Form.Item<FieldType>
              label="Account"
              name="remark"
              rules={[{ required: true, message: "账号备注" }]}>
              <Input />
            </Form.Item>

            <Form.Item<FieldType>
              label="Key"
              name="secret"
              rules={[{ required: true, message: "秘钥" }]}>
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ThemeProvider>
  )
}

export default IndexPopup
