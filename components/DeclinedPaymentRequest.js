import React, { useState, useEffect, useCallback } from 'react'
import { Table, Icon, Popup, Header } from 'semantic-ui-react'
import { API, graphqlOperation } from 'aws-amplify'
import gql from 'graphql-tag'
import { Badge, Button } from '@shopify/polaris'
import { toCurrency, formatDate } from '../utils/helper'
import config from 'aws-amplify'

API.configure(config)

const listPaymentRequest = gql`
    query listPaymentRequest($limit: Int, $nextToken: String) {
        listPaymentRequests(
            limit: $limit
            nextToken: $nextToken
            filter: { status: { eq: DECLINED } }
        ) {
            items {
                bonusAmount
                createdAt
                customerId
                id
                orderId
                status
                updatedAt
            }
            nextToken
        }
    }
`

const DeclinedPaymentRequest = () => {
    const [nextPaginateToken, setNextPaginateToken] = useState('')
    const [paymentRequestItems, setPaymentRequestItems] = useState([])

    const fetchAcceptedPayments = useCallback(async () => {
        try {
            const res = await API.graphql(graphqlOperation(listPaymentRequest, { limit: 20 }))
            setNextPaginateToken(res.data.listPaymentRequests.nextToken)
            setPaymentRequestItems(res.data.listPaymentRequests.items)
            console.log('Accepted payments', res.data)
        } catch (error) {
            console.log(error)
        }
    }, [])

    useEffect(() => {
        fetchAcceptedPayments()
    }, [fetchAcceptedPayments])

    const loadMore = async () => {
        try {
            const res = await API.graphql(
                graphqlOperation(listPaymentRequest, { limit: 20, nextToken: nextPaginateToken })
            )
            setNextPaginateToken(res.data.listPaymentRequests.nextToken)
            setPaymentRequestItems([...paymentRequestItems, ...res.data.listPaymentRequests.items])
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <>
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Customer Id</Table.HeaderCell>
                        <Table.HeaderCell>Bonus Amount</Table.HeaderCell>
                        <Table.HeaderCell>Created At</Table.HeaderCell>
                        <Table.HeaderCell>Updated At</Table.HeaderCell>
                        <Table.HeaderCell>Status</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {paymentRequestItems &&
                        paymentRequestItems
                            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                            .map((item) => (
                                <Table.Row key={item.id}>
                                    <Table.Cell>
                                        <Badge size="small">{item.customerId}</Badge>
                                    </Table.Cell>
                                    <Table.Cell>{toCurrency(item.bonusAmount)}</Table.Cell>
                                    <Table.Cell>{formatDate(item.createdAt)}</Table.Cell>
                                    <Table.Cell>{formatDate(item.updatedAt)}</Table.Cell>
                                    <Table.Cell>
                                        <Badge size="small" progress="incomplete" status="critical">
                                            {item.status}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                </Table.Body>
            </Table>
            <Button disabled={!nextPaginateToken} primary onClick={loadMore}>
                Load more
            </Button>
        </>
    )
}

export default DeclinedPaymentRequest
